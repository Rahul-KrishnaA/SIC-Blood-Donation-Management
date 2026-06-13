from typing import List
import matplotlib.pyplot as plt
import seaborn as sns
from collections import Counter

from models.donor import Donor
from models.blood_inventory import BloodInventory

# Palette: #D92243 | #F69D39 | #E0C375 | #FFF5E5
_RED    = "#D92243"
_ORANGE = "#F69D39"
_GOLD   = "#E0C375"
_CREAM  = "#FFF5E5"
_BAR_PALETTE = [_RED, _ORANGE, _GOLD, "#c9a84c", "#b8361e", "#e87a50", "#d4a843", "#f0b97a"]


def _apply_base_style(fig, ax):
    fig.patch.set_facecolor(_CREAM)
    ax.set_facecolor("#fffaf0")
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color(_GOLD)
    ax.spines["bottom"].set_color(_GOLD)
    ax.tick_params(colors="#5a3e28")
    ax.xaxis.label.set_color("#5a3e28")
    ax.yaxis.label.set_color("#5a3e28")
    ax.title.set_color(_RED)


def blood_group_distribution_chart(donors: List[Donor]) -> plt.Figure:
    counts = Counter(d.blood_group for d in donors)
    if not counts:
        fig, ax = plt.subplots(facecolor=_CREAM)
        ax.set_facecolor(_CREAM)
        ax.text(0.5, 0.5, "No donor data", ha="center", va="center", color=_RED)
        ax.axis("off")
        return fig

    groups = sorted(counts.keys())
    values = [counts[g] for g in groups]

    fig, ax = plt.subplots(figsize=(8, 4))
    bars = ax.bar(groups, values, color=_RED, edgecolor=_ORANGE, linewidth=0.8)

    # gradient-style: alternate tones
    for i, bar in enumerate(bars):
        bar.set_facecolor(_RED if i % 2 == 0 else _ORANGE)

    ax.set_title("Blood Group Distribution Among Donors", fontweight="bold", pad=12)
    ax.set_xlabel("Blood Group")
    ax.set_ylabel("Number of Donors")
    _apply_base_style(fig, ax)
    fig.tight_layout()
    return fig


def inventory_status_chart(inventory: List[BloodInventory]) -> plt.Figure:
    if not inventory:
        fig, ax = plt.subplots(facecolor=_CREAM)
        ax.set_facecolor(_CREAM)
        ax.text(0.5, 0.5, "No inventory data", ha="center", va="center", color=_RED)
        ax.axis("off")
        return fig

    items  = sorted(inventory, key=lambda x: x.blood_group)
    groups = [i.blood_group for i in items]
    units  = [i.available_units for i in items]
    colors = [_RED if i.is_expired() else (_ORANGE if i.available_units < 10 else _GOLD) for i in items]

    fig, ax = plt.subplots(figsize=(8, 4))
    ax.bar(groups, units, color=colors, edgecolor="#c9a84c", linewidth=0.8)
    ax.set_title("Blood Inventory Status", fontweight="bold", pad=12)
    ax.set_xlabel("Blood Group")
    ax.set_ylabel("Available Units")

    from matplotlib.patches import Patch
    legend = [
        Patch(facecolor=_GOLD,   label="Sufficient"),
        Patch(facecolor=_ORANGE, label="Low Stock (<10)"),
        Patch(facecolor=_RED,    label="Expired"),
    ]
    ax.legend(handles=legend, loc="upper right", framealpha=0.7, facecolor=_CREAM)
    _apply_base_style(fig, ax)
    fig.tight_layout()
    return fig


def monthly_donations_chart(monthly_summary: dict) -> plt.Figure:
    if not monthly_summary:
        fig, ax = plt.subplots(facecolor=_CREAM)
        ax.set_facecolor(_CREAM)
        ax.text(0.5, 0.5, "No donation history", ha="center", va="center", color=_RED)
        ax.axis("off")
        return fig

    months = sorted(monthly_summary.keys())
    values = [monthly_summary[m] for m in months]

    fig, ax = plt.subplots(figsize=(10, 4))
    ax.fill_between(months, values, alpha=0.18, color=_ORANGE)
    sns.lineplot(x=months, y=values, marker="o", color=_RED,
                 markerfacecolor=_ORANGE, markeredgecolor=_RED,
                 linewidth=2.5, markersize=8, ax=ax)
    ax.set_title("Monthly Blood Donations", fontweight="bold", pad=12)
    ax.set_xlabel("Month")
    ax.set_ylabel("Units Donated")
    plt.setp(ax.xaxis.get_majorticklabels(), rotation=45, ha="right")
    _apply_base_style(fig, ax)
    fig.tight_layout()
    return fig
