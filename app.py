import streamlit as st
from datetime import date
from collections import Counter

from services.donor_service import DonorService
from services.inventory_service import InventoryService
from services.emergency_service import EmergencyService
from services.history_service import HistoryService
from analytics.dashboard import (
    blood_group_distribution_chart,
    inventory_status_chart,
    monthly_donations_chart,
)

st.set_page_config(
    page_title="SIC Blood Donation Management",
    page_icon="🩸",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Custom CSS ────────────────────────────────────────────────────────────────

st.markdown("""
<style>
/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: linear-gradient(180deg, #7b0000 0%, #b71c1c 60%, #d32f2f 100%);
}
[data-testid="stSidebar"] * { color: #fff !important; }
[data-testid="stSidebar"] .stRadio label { font-size: 15px; font-weight: 500; }
[data-testid="stSidebar"] hr { border-color: rgba(255,255,255,0.3); }

/* ── Metric cards ── */
[data-testid="stMetric"] {
    background: #fff;
    border: 1px solid #e0e0e0;
    border-left: 4px solid #c62828;
    border-radius: 8px;
    padding: 16px 20px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
[data-testid="stMetricValue"] { color: #b71c1c; font-weight: 700; }
[data-testid="stMetricLabel"] { color: #555; font-size: 13px; }

/* ── Primary buttons ── */
.stButton > button {
    background: #c62828;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    padding: 8px 20px;
    transition: background 0.2s;
}
.stButton > button:hover { background: #8b0000; color: white; }

/* ── Form submit buttons ── */
[data-testid="stFormSubmitButton"] > button {
    background: #c62828;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
}
[data-testid="stFormSubmitButton"] > button:hover { background: #8b0000; }

/* ── Page title accent ── */
h1 { border-bottom: 3px solid #c62828; padding-bottom: 8px; color: #1a1a1a; }

/* ── Stat badge pill ── */
.badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}
.badge-green  { background: #e8f5e9; color: #2e7d32; }
.badge-red    { background: #ffebee; color: #c62828; }
.badge-orange { background: #fff3e0; color: #e65100; }
.badge-blue   { background: #e3f2fd; color: #1565c0; }

/* ── Card container ── */
.info-card {
    background: #fff8f8;
    border: 1px solid #ffcdd2;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
}
</style>
""", unsafe_allow_html=True)


# ── Services ──────────────────────────────────────────────────────────────────

def _init_services():
    if "donor_svc" not in st.session_state:
        st.session_state.donor_svc = DonorService()
    if "inventory_svc" not in st.session_state:
        st.session_state.inventory_svc = InventoryService()
    if "emergency_svc" not in st.session_state:
        st.session_state.emergency_svc = EmergencyService(st.session_state.inventory_svc)
    if "history_svc" not in st.session_state:
        st.session_state.history_svc = HistoryService()


_init_services()

donor_svc: DonorService        = st.session_state.donor_svc
inventory_svc: InventoryService = st.session_state.inventory_svc
emergency_svc: EmergencyService = st.session_state.emergency_svc
history_svc: HistoryService    = st.session_state.history_svc


# ── Sidebar ───────────────────────────────────────────────────────────────────

st.sidebar.markdown("## 🩸 Blood Donation\nManagement System")
st.sidebar.markdown("---")

page = st.sidebar.radio(
    "Navigate",
    ["🏠 Overview", "➕ Register Donor", "🔍 Donor Search",
     "🩸 Blood Inventory", "🚨 Emergency Requests",
     "📋 Donation History", "📊 Analytics"],
    label_visibility="collapsed",
)

# Live sidebar stats
st.sidebar.markdown("---")
all_donors   = donor_svc.all_donors()
eligible_cnt = sum(1 for d in all_donors if d.is_eligible())
total_units  = sum(i.available_units for i in inventory_svc.get_valid_inventory())
queue_cnt    = emergency_svc.queue_size()

st.sidebar.markdown(f"""
**System Status**
- 👥 Donors: **{len(all_donors)}**
- ✅ Eligible: **{eligible_cnt}**
- 🩸 Blood Units: **{total_units}**
- 🚨 Queue: **{queue_cnt}**
""")
st.sidebar.markdown("---")
st.sidebar.caption("SIC Hackathon · 2026")


# ── Helpers ───────────────────────────────────────────────────────────────────

BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

def _eligibility_badge(eligible: bool) -> str:
    return "🟢 Eligible" if eligible else "🔴 Ineligible"

def _priority_label(p: int) -> str:
    return {1: "🔴 Critical", 2: "🟠 Urgent", 3: "🟢 Normal"}.get(p, str(p))


# ── Page: Overview ────────────────────────────────────────────────────────────

def _page_overview():
    st.title("🏠 Overview")
    st.markdown("Real-time summary of the blood bank system.")

    # Row 1 – headline metrics
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Donors",       len(all_donors))
    c2.metric("Eligible to Donate", eligible_cnt)
    c3.metric("Blood Units Available", total_units)
    c4.metric("Emergency Queue",    queue_cnt,
              delta=f"{'⚠ Action needed' if queue_cnt else 'All clear'}",
              delta_color="inverse" if queue_cnt else "off")

    st.markdown("---")

    # Row 2 – blood group breakdown + low-stock alerts
    col_left, col_right = st.columns([1, 1])

    with col_left:
        st.subheader("Donor Blood Group Breakdown")
        counts = Counter(d.blood_group for d in all_donors)
        rows = []
        for bg in BLOOD_GROUPS:
            cnt = counts.get(bg, 0)
            rows.append({"Blood Group": bg, "Donors": cnt,
                          "Bar": cnt / max(counts.values(), default=1)})
        for r in rows:
            col_a, col_b, col_c = st.columns([1, 1, 4])
            col_a.markdown(f"**{r['Blood Group']}**")
            col_b.markdown(f"{r['Donors']}")
            col_c.progress(r["Bar"])

    with col_right:
        st.subheader("Inventory Quick View")
        inventory = inventory_svc.get_inventory()
        max_units = max((i.available_units for i in inventory), default=1)
        for item in sorted(inventory, key=lambda x: x.available_units):
            label  = f"{'🔴' if item.is_expired() else ('🟠' if item.available_units < 10 else '🟢')} {item.blood_group}"
            pct    = item.available_units / max(max_units, 1)
            col_a, col_b, col_c = st.columns([1, 1, 4])
            col_a.markdown(f"**{label}**")
            col_b.markdown(f"{item.available_units} u")
            col_c.progress(pct)

    st.markdown("---")

    # Row 3 – recent donations
    st.subheader("Recent Donations")
    recent = history_svc.recent_donations(5)
    if recent:
        st.dataframe(
            [{"Date": r.donation_date, "Donor": r.donor_id,
              "Units": r.units_donated, "Recipient": r.recipient_details}
             for r in recent],
            use_container_width=True,
            column_config={
                "Units": st.column_config.NumberColumn("Units", format="%d 🩸"),
                "Date":  st.column_config.DateColumn("Date", format="DD MMM YYYY"),
            },
        )
    else:
        st.info("No donations recorded yet.")


# ── Page: Donor Registration ──────────────────────────────────────────────────

def _page_donor_registration():
    st.title("➕ Register Donor")

    with st.form("register_donor"):
        col1, col2 = st.columns(2)
        name         = col1.text_input("Full Name")
        age          = col2.number_input("Age", min_value=18, max_value=65, value=25, step=1)
        blood_group  = col1.selectbox("Blood Group", BLOOD_GROUPS)
        city         = col2.text_input("City")
        last_donation = col1.date_input("Last Donation Date (leave blank if first-time)", value=None)
        submitted    = st.form_submit_button("🩸 Register Donor")

    if submitted:
        if not name.strip() or not city.strip():
            st.error("Name and City are required.")
        else:
            last_str = last_donation.isoformat() if last_donation else None
            donor = donor_svc.register(name.strip(), int(age), blood_group, city.strip(), last_str)
            st.success(f"✅ Registered **{donor.name}** successfully!  \nDonor ID: `{donor.donor_id}`")

    st.divider()
    st.subheader("All Registered Donors")
    donors = donor_svc.all_donors()
    if donors:
        rows = []
        for d in donors:
            rows.append({
                "ID":           d.donor_id,
                "Name":         d.name,
                "Age":          d.age,
                "Blood Group":  d.blood_group,
                "City":         d.city.title(),
                "Last Donation": d.last_donation_date or "—",
                "Eligible":     _eligibility_badge(d.is_eligible()),
            })
        st.dataframe(
            rows,
            use_container_width=True,
            column_config={
                "Age":  st.column_config.NumberColumn("Age", format="%d yrs"),
                "Eligible": st.column_config.TextColumn("Eligible"),
            },
        )
        st.caption(f"{len(donors)} donor(s) registered")
    else:
        st.info("No donors registered yet.")


# ── Page: Donor Search ────────────────────────────────────────────────────────

def _page_donor_search():
    st.title("🔍 Donor Search")

    search_mode = st.radio("Search by", ["Blood Group", "City", "Eligible Donors"], horizontal=True)

    results = []
    if search_mode == "Blood Group":
        bg = st.selectbox("Blood Group", BLOOD_GROUPS)
        results = donor_svc.search_by_blood_group(bg)

    elif search_mode == "City":
        city = st.text_input("City name")
        results = donor_svc.search_by_city(city) if city.strip() else []

    else:
        col1, col2 = st.columns([1, 2])
        bg_filter = col1.selectbox("Blood Group (optional)", ["All"] + BLOOD_GROUPS)
        blood_group_arg = None if bg_filter == "All" else bg_filter
        results = donor_svc.search_eligible_donors(blood_group_arg)
        col2.markdown(
            f"<br><span style='color:#555;font-size:13px;'>Donors who last donated "
            f"≥ 90 days ago, sorted oldest-donation first</span>",
            unsafe_allow_html=True,
        )

    if results:
        rows = []
        for d in results:
            rows.append({
                "ID":            d.donor_id,
                "Name":          d.name,
                "Age":           d.age,
                "Blood Group":   d.blood_group,
                "City":          d.city.title(),
                "Last Donation": d.last_donation_date or "Never",
                "Status":        _eligibility_badge(d.is_eligible()),
            })
        st.dataframe(
            rows,
            use_container_width=True,
            column_config={
                "Age":    st.column_config.NumberColumn("Age", format="%d yrs"),
                "Status": st.column_config.TextColumn("Status"),
            },
        )
        st.caption(f"**{len(results)}** donor(s) found.")
    else:
        st.info("No donors found for the given criteria.")


# ── Page: Blood Inventory ─────────────────────────────────────────────────────

def _page_inventory():
    st.title("🩸 Blood Inventory")

    col_form, col_status = st.columns([1, 1])

    with col_form:
        st.subheader("Add / Update Units")
        with st.form("add_inventory"):
            bg     = st.selectbox("Blood Group", BLOOD_GROUPS, key="inv_bg")
            units  = st.number_input("Units to Add", min_value=1, value=10, step=1)
            expiry = st.date_input("Expiry Date",
                                   value=date.today().replace(year=date.today().year + 1))
            add_submitted = st.form_submit_button("➕ Add Units")

        if add_submitted:
            item = inventory_svc.add_units(bg, int(units), expiry.isoformat())
            st.success(f"**{bg}** → **{item.available_units}** units  \nExpires: {item.expiry_date}")

    with col_status:
        st.subheader("Stock Level Overview")
        all_items = inventory_svc.get_inventory()
        if all_items:
            max_u = max(i.available_units for i in all_items)
            for item in sorted(all_items, key=lambda x: x.available_units, reverse=True):
                expired = item.is_expired()
                low     = item.available_units < 10
                icon    = "🔴" if expired else ("🟠" if low else "🟢")
                pct     = item.available_units / max(max_u, 1)
                label   = f"{icon} **{item.blood_group}** — {item.available_units} units"
                if expired:
                    label += " *(EXPIRED)*"
                elif low:
                    label += " *(LOW)*"
                st.markdown(label)
                st.progress(pct)
        else:
            st.info("No inventory yet.")

    st.divider()
    st.subheader("Full Inventory Table")
    all_items = inventory_svc.get_inventory()
    if all_items:
        rows = []
        for item in sorted(all_items, key=lambda x: x.blood_group):
            expired = item.is_expired()
            low     = item.available_units < 10
            status  = "🔴 Expired" if expired else ("🟠 Low Stock" if low else "🟢 OK")
            rows.append({
                "Blood Group":    item.blood_group,
                "Available Units": item.available_units,
                "Expiry Date":    item.expiry_date,
                "Status":         status,
            })
        st.dataframe(
            rows,
            use_container_width=True,
            column_config={
                "Available Units": st.column_config.ProgressColumn(
                    "Available Units",
                    min_value=0,
                    max_value=max(i.available_units for i in all_items),
                    format="%d units",
                ),
                "Expiry Date": st.column_config.DateColumn("Expiry Date", format="DD MMM YYYY"),
            },
        )


# ── Page: Emergency Requests ──────────────────────────────────────────────────

def _page_emergency():
    st.title("🚨 Emergency Blood Requests")

    col_form, col_queue = st.columns([1, 1])

    with col_form:
        st.subheader("Submit Request")
        with st.form("emergency_form"):
            bg       = st.selectbox("Blood Group Needed", BLOOD_GROUPS, key="emg_bg")
            units    = st.number_input("Units Needed", min_value=1, value=2, step=1)
            hospital = st.text_input("Hospital Name")
            contact  = st.text_input("Contact Number")
            priority_label = st.selectbox(
                "Priority",
                ["🔴 1 - Critical", "🟠 2 - Urgent", "🟢 3 - Normal"],
            )
            submit_req = st.form_submit_button("🚨 Submit Emergency Request")

        if submit_req:
            if not hospital.strip() or not contact.strip():
                st.error("Hospital and contact are required.")
            else:
                priority_num = int(priority_label.split(" - ")[0].split()[-1])
                req = emergency_svc.submit_request(
                    bg, int(units), hospital.strip(), contact.strip(), priority_num
                )
                st.success(
                    f"Request queued! ID: `{req.request_id}`  \n"
                    f"Queue size: **{emergency_svc.queue_size()}**"
                )

    with col_queue:
        st.subheader(f"Queue ({emergency_svc.queue_size()} pending)")
        if st.button("⚡ Process Next Request", use_container_width=True):
            if emergency_svc.queue_size() == 0:
                st.warning("No pending requests.")
            else:
                req, fulfilled = emergency_svc.process_next()
                if fulfilled:
                    st.success(
                        f"✅ **Fulfilled**  \n"
                        f"{req.hospital} received **{req.units_needed} units** of **{req.blood_group}**"
                    )
                else:
                    st.error(
                        f"❌ **Insufficient Stock**  \n"
                        f"{req.hospital} requested {req.units_needed} units of {req.blood_group}"
                    )

        pending = emergency_svc.pending_requests()
        if pending:
            rows = [
                {
                    "Priority":     _priority_label(r.priority),
                    "Blood Group":  r.blood_group,
                    "Units":        r.units_needed,
                    "Hospital":     r.hospital,
                    "Contact":      r.contact,
                    "ID":           r.request_id,
                }
                for r in pending
            ]
            st.dataframe(rows, use_container_width=True,
                         column_config={"Units": st.column_config.NumberColumn("Units", format="%d 🩸")})
        else:
            st.info("Queue is empty — no pending requests.")


# ── Page: Donation History ────────────────────────────────────────────────────

def _page_history():
    st.title("📋 Donation History")

    col_form, col_search = st.columns([1, 1])

    with col_form:
        st.subheader("Record a Donation")
        with st.form("record_donation"):
            donor_id      = st.text_input("Donor ID")
            units         = st.number_input("Units Donated", min_value=1, value=1, step=1)
            recipient     = st.text_input("Recipient Details (name / ward)")
            donation_date = st.date_input("Donation Date", value=date.today())
            record_submitted = st.form_submit_button("📝 Record Donation")

        if record_submitted:
            donor = donor_svc.get_donor(donor_id.strip())
            if not donor:
                st.error(f"Donor ID `{donor_id}` not found.")
            else:
                history_svc.record_donation(
                    donor.donor_id, donation_date.isoformat(), int(units), recipient
                )
                donor_svc.update_last_donation_date(donor.donor_id, donation_date.isoformat())
                st.success(f"✅ Donation by **{donor.name}** recorded.")

    with col_search:
        st.subheader("Donor History Lookup")
        search_id = st.text_input("Enter Donor ID")
        if search_id.strip():
            donor_records = history_svc.donor_history(search_id.strip())
            if donor_records:
                st.dataframe(
                    [{"Date": r.donation_date, "Units": r.units_donated,
                      "Recipient": r.recipient_details}
                     for r in donor_records],
                    use_container_width=True,
                    column_config={
                        "Units": st.column_config.NumberColumn("Units", format="%d 🩸"),
                        "Date":  st.column_config.DateColumn("Date", format="DD MMM YYYY"),
                    },
                )
            else:
                st.info("No history found for this donor.")

    st.divider()
    st.subheader("Recent Donations")
    n = st.slider("Show last N records", 5, 50, 10)
    records = history_svc.recent_donations(n)
    if records:
        st.dataframe(
            [{"Date": r.donation_date, "Donor ID": r.donor_id,
              "Units": r.units_donated, "Recipient": r.recipient_details,
              "Record ID": r.record_id}
             for r in records],
            use_container_width=True,
            column_config={
                "Units": st.column_config.NumberColumn("Units", format="%d 🩸"),
                "Date":  st.column_config.DateColumn("Date", format="DD MMM YYYY"),
            },
        )
    else:
        st.info("No donation records found.")


# ── Page: Analytics ───────────────────────────────────────────────────────────

def _page_analytics():
    st.title("📊 Analytics Dashboard")

    tab1, tab2, tab3 = st.tabs(
        ["🧑‍🤝‍🧑 Blood Group Distribution", "🩸 Inventory Status", "📅 Monthly Donations"]
    )

    with tab1:
        donors = donor_svc.all_donors()
        col_chart, col_table = st.columns([2, 1])
        with col_chart:
            st.subheader("Donor Distribution by Blood Group")
            st.pyplot(blood_group_distribution_chart(donors))
        with col_table:
            st.subheader("Breakdown")
            if donors:
                counts = Counter(d.blood_group for d in donors)
                total  = len(donors)
                st.dataframe(
                    [{"Blood Group": bg,
                      "Count": counts.get(bg, 0),
                      "Share %": round(counts.get(bg, 0) / total * 100, 1)}
                     for bg in BLOOD_GROUPS],
                    use_container_width=True,
                    column_config={
                        "Share %": st.column_config.ProgressColumn(
                            "Share %", min_value=0, max_value=100, format="%.1f%%"
                        )
                    },
                )

    with tab2:
        inventory = inventory_svc.get_inventory()
        col_chart, col_table = st.columns([2, 1])
        with col_chart:
            st.subheader("Blood Inventory Status")
            st.pyplot(inventory_status_chart(inventory))
        with col_table:
            st.subheader("Units by Group")
            if inventory:
                max_u = max(i.available_units for i in inventory)
                st.dataframe(
                    [{"Group": i.blood_group,
                      "Units": i.available_units,
                      "Expires": i.expiry_date,
                      "Status": "🔴 Expired" if i.is_expired() else "🟢 OK"}
                     for i in sorted(inventory, key=lambda x: x.available_units, reverse=True)],
                    use_container_width=True,
                    column_config={
                        "Units": st.column_config.ProgressColumn(
                            "Units", min_value=0, max_value=max_u, format="%d"
                        )
                    },
                )

    with tab3:
        summary = history_svc.monthly_summary()
        col_chart, col_table = st.columns([2, 1])
        with col_chart:
            st.subheader("Monthly Donation Trends")
            st.pyplot(monthly_donations_chart(summary))
        with col_table:
            st.subheader("Monthly Totals")
            if summary:
                st.dataframe(
                    [{"Month": m, "Total Units": u}
                     for m, u in sorted(summary.items(), reverse=True)],
                    use_container_width=True,
                )


# ── Router ────────────────────────────────────────────────────────────────────

if page == "🏠 Overview":
    _page_overview()
elif page == "➕ Register Donor":
    _page_donor_registration()
elif page == "🔍 Donor Search":
    _page_donor_search()
elif page == "🩸 Blood Inventory":
    _page_inventory()
elif page == "🚨 Emergency Requests":
    _page_emergency()
elif page == "📋 Donation History":
    _page_history()
elif page == "📊 Analytics":
    _page_analytics()
