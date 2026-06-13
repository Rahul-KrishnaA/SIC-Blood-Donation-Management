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

st.set_page_config(page_title="Blood Donation Management System", page_icon="🩸", layout="wide")


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

donor_svc: DonorService = st.session_state.donor_svc
inventory_svc: InventoryService = st.session_state.inventory_svc
emergency_svc: EmergencyService = st.session_state.emergency_svc
history_svc: HistoryService = st.session_state.history_svc

st.sidebar.title("🩸 Blood Donation System")
page = st.sidebar.radio(
    "Navigate",
    ["Donor Registration", "Donor Search", "Blood Inventory",
     "Emergency Requests", "Donation History", "Analytics Dashboard"],
)


# ── Page: Donor Registration ──────────────────────────────────────────────────

def _page_donor_registration():
    st.title("Donor Registration")
    with st.form("register_donor"):
        col1, col2 = st.columns(2)
        name = col1.text_input("Full Name")
        age = col2.number_input("Age", min_value=18, max_value=65, value=25, step=1)
        blood_group = col1.selectbox("Blood Group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        city = col2.text_input("City")
        last_donation = col1.date_input("Last Donation Date", value=None)
        submitted = st.form_submit_button("Register Donor")

    if submitted:
        if not name or not city:
            st.error("Name and City are required.")
        else:
            last_str = last_donation.isoformat() if last_donation else None
            donor = donor_svc.register(name, int(age), blood_group, city, last_str)
            st.success(f"Registered successfully! Donor ID: **{donor.donor_id}**")

    st.divider()
    st.subheader("All Registered Donors")
    donors = donor_svc.all_donors()
    if donors:
        st.dataframe(
            [d.to_dict() for d in donors],
            use_container_width=True,
        )
    else:
        st.info("No donors registered yet.")


# ── Page: Donor Search ────────────────────────────────────────────────────────

def _page_donor_search():
    st.title("Donor Search")
    search_mode = st.radio("Search by", ["Blood Group", "City", "Eligible Donors"], horizontal=True)

    results = []
    if search_mode == "Blood Group":
        bg = st.selectbox("Blood Group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        results = donor_svc.search_by_blood_group(bg)

    elif search_mode == "City":
        city = st.text_input("City name")
        results = donor_svc.search_by_city(city) if city else []

    else:
        bg_filter = st.selectbox("Blood Group (optional)", ["All"] + ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        blood_group_arg = None if bg_filter == "All" else bg_filter
        results = donor_svc.search_eligible_donors(blood_group_arg)

    if results:
        rows = []
        for d in results:
            row = d.to_dict()
            row["eligible"] = d.is_eligible()
            rows.append(row)
        st.dataframe(rows, use_container_width=True)
        st.caption(f"{len(results)} donor(s) found.")
    else:
        st.info("No donors found for the given criteria.")


# ── Page: Blood Inventory ─────────────────────────────────────────────────────

def _page_inventory():
    st.title("Blood Inventory Management")

    st.subheader("Add / Update Units")
    with st.form("add_inventory"):
        col1, col2, col3 = st.columns(3)
        bg = col1.selectbox("Blood Group", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], key="inv_bg")
        units = col2.number_input("Units to Add", min_value=1, value=1, step=1)
        expiry = col3.date_input("Expiry Date")
        add_submitted = st.form_submit_button("Add Units")

    if add_submitted:
        item = inventory_svc.add_units(bg, int(units), expiry.isoformat())
        st.success(f"{bg}: now **{item.available_units}** units (expires {item.expiry_date})")

    st.divider()
    st.subheader("Current Inventory")
    all_items = inventory_svc.get_inventory()
    if all_items:
        rows = []
        for item in all_items:
            rows.append({
                "Blood Group": item.blood_group,
                "Available Units": item.available_units,
                "Expiry Date": item.expiry_date,
                "Status": "Expired" if item.is_expired() else "Valid",
            })
        st.dataframe(rows, use_container_width=True)
    else:
        st.info("Inventory is empty. Add units above.")


# ── Page: Emergency Requests ──────────────────────────────────────────────────

def _page_emergency():
    st.title("Emergency Blood Requests")

    st.subheader("Submit Emergency Request")
    with st.form("emergency_form"):
        col1, col2 = st.columns(2)
        bg = col1.selectbox("Blood Group Needed", ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], key="emg_bg")
        units = col2.number_input("Units Needed", min_value=1, value=1, step=1)
        hospital = col1.text_input("Hospital Name")
        contact = col2.text_input("Contact Number")
        priority_label = st.selectbox("Priority", ["1 - Critical", "2 - Urgent", "3 - Normal"])
        submit_req = st.form_submit_button("Submit Request")

    if submit_req:
        if not hospital or not contact:
            st.error("Hospital and contact are required.")
        else:
            priority_num = int(priority_label.split(" - ")[0])
            req = emergency_svc.submit_request(bg, int(units), hospital, contact, priority_num)
            st.success(f"Request submitted (ID: {req.request_id}). Queue size: {emergency_svc.queue_size()}")

    st.divider()
    col_a, col_b = st.columns([2, 1])
    col_a.subheader(f"Pending Requests ({emergency_svc.queue_size()})")
    if col_b.button("Process Next Request"):
        if emergency_svc.queue_size() == 0:
            st.warning("No pending requests.")
        else:
            req, fulfilled = emergency_svc.process_next()
            if fulfilled:
                st.success(f"Fulfilled: {req.hospital} received {req.units_needed} units of {req.blood_group}.")
            else:
                st.error(f"Insufficient stock for {req.hospital} ({req.units_needed} units of {req.blood_group}).")

    pending = emergency_svc.pending_requests()
    if pending:
        rows = [{"ID": r.request_id, "Priority": r.priority, "Blood Group": r.blood_group,
                 "Units": r.units_needed, "Hospital": r.hospital, "Contact": r.contact}
                for r in pending]
        st.dataframe(rows, use_container_width=True)
    else:
        st.info("No pending emergency requests.")


# ── Page: Donation History ────────────────────────────────────────────────────

def _page_history():
    st.title("Donation History")

    st.subheader("Record a Donation")
    with st.form("record_donation"):
        col1, col2 = st.columns(2)
        donor_id = col1.text_input("Donor ID")
        units = col2.number_input("Units Donated", min_value=1, value=1, step=1)
        recipient = col1.text_input("Recipient Details (name / ward)")
        donation_date = col2.date_input("Donation Date")
        record_submitted = st.form_submit_button("Record Donation")

    if record_submitted:
        donor = donor_svc.get_donor(donor_id.strip())
        if not donor:
            st.error(f"Donor ID '{donor_id}' not found.")
        else:
            history_svc.record_donation(donor.donor_id, donation_date.isoformat(), int(units), recipient)
            donor_svc.update_last_donation_date(donor.donor_id, donation_date.isoformat())
            st.success(f"Donation recorded for {donor.name}.")

    st.divider()
    st.subheader("Recent Donations")
    n = st.slider("Show last N records", 5, 50, 10)
    records = history_svc.recent_donations(n)
    if records:
        rows = [{"Record ID": r.record_id, "Donor ID": r.donor_id, "Date": r.donation_date,
                 "Units": r.units_donated, "Recipient": r.recipient_details}
                for r in records]
        st.dataframe(rows, use_container_width=True)
    else:
        st.info("No donation records found.")

    st.divider()
    st.subheader("Search by Donor ID")
    search_id = st.text_input("Donor ID to search")
    if search_id:
        donor_records = history_svc.donor_history(search_id.strip())
        if donor_records:
            st.dataframe([{"Date": r.donation_date, "Units": r.units_donated,
                           "Recipient": r.recipient_details} for r in donor_records],
                         use_container_width=True)
        else:
            st.info("No history found for this donor.")


# ── Page: Analytics Dashboard ─────────────────────────────────────────────────

def _page_analytics():
    st.title("Analytics Dashboard")

    tab1, tab2, tab3 = st.tabs(["Blood Group Distribution", "Inventory Status", "Monthly Donations"])

    with tab1:
        st.subheader("Blood Group Distribution Among Donors")
        donors = donor_svc.all_donors()
        fig = blood_group_distribution_chart(donors)
        st.pyplot(fig)
        if donors:
            counts = Counter(d.blood_group for d in donors)
            st.dataframe(
                [{"Blood Group": bg, "Count": cnt} for bg, cnt in sorted(counts.items())],
                use_container_width=True,
            )

    with tab2:
        st.subheader("Blood Inventory Status")
        inventory = inventory_svc.get_inventory()
        fig = inventory_status_chart(inventory)
        st.pyplot(fig)
        if inventory:
            rows = [{"Blood Group": i.blood_group, "Available Units": i.available_units,
                     "Expiry Date": i.expiry_date,
                     "Status": "Expired" if i.is_expired() else "Valid"}
                    for i in inventory]
            st.dataframe(rows, use_container_width=True)

    with tab3:
        st.subheader("Monthly Donation Trends")
        summary = history_svc.monthly_summary()
        fig = monthly_donations_chart(summary)
        st.pyplot(fig)
        if summary:
            rows = [{"Month": m, "Total Units": u} for m, u in sorted(summary.items())]
            st.dataframe(rows, use_container_width=True)


# ── Router ────────────────────────────────────────────────────────────────────

if page == "Donor Registration":
    _page_donor_registration()
elif page == "Donor Search":
    _page_donor_search()
elif page == "Blood Inventory":
    _page_inventory()
elif page == "Emergency Requests":
    _page_emergency()
elif page == "Donation History":
    _page_history()
elif page == "Analytics Dashboard":
    _page_analytics()
