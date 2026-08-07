from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable, ListFlowable, ListItem

INK = HexColor("#0B1220")
MUTED = HexColor("#475569")
ACCENT = HexColor("#2563EB")
LINE = HexColor("#CBD5E1")

styles = getSampleStyleSheet()
name_style = ParagraphStyle("Name", parent=styles["Title"], fontName="Helvetica-Bold",
                             fontSize=22, textColor=INK, alignment=TA_LEFT, spaceAfter=2)
role_style = ParagraphStyle("Role", parent=styles["Normal"], fontName="Helvetica",
                             fontSize=11.5, textColor=ACCENT, spaceAfter=6)
contact_style = ParagraphStyle("Contact", parent=styles["Normal"], fontName="Helvetica",
                                fontSize=9, textColor=MUTED, spaceAfter=14)
section_style = ParagraphStyle("Section", parent=styles["Normal"], fontName="Helvetica-Bold",
                                fontSize=10.5, textColor=INK, spaceBefore=14, spaceAfter=6,
                                letterSpacing=0.6)
body_style = ParagraphStyle("Body", parent=styles["Normal"], fontName="Helvetica",
                             fontSize=9.5, textColor=INK, leading=14, spaceAfter=4)
item_title_style = ParagraphStyle("ItemTitle", parent=styles["Normal"], fontName="Helvetica-Bold",
                                   fontSize=9.8, textColor=INK, spaceAfter=1)
item_meta_style = ParagraphStyle("ItemMeta", parent=styles["Normal"], fontName="Helvetica-Oblique",
                                  fontSize=8.8, textColor=MUTED, spaceAfter=3)
bullet_style = ParagraphStyle("Bullet", parent=styles["Normal"], fontName="Helvetica",
                               fontSize=9.3, textColor=INK, leading=13)

doc = SimpleDocTemplate(
    "/home/claude/cyber-portfolio/public/resume.pdf",
    pagesize=letter,
    topMargin=0.6 * inch,
    bottomMargin=0.6 * inch,
    leftMargin=0.65 * inch,
    rightMargin=0.65 * inch,
    title="Alex Rivera - Resume",
)

story = []
story.append(Paragraph("Alex Rivera", name_style))
story.append(Paragraph("Aspiring Cybersecurity Analyst &amp; Network Administrator", role_style))
story.append(Paragraph(
    "alex.rivera.sec@protonmail.com &nbsp;&nbsp;|&nbsp;&nbsp; github.com/alexrivera-sec "
    "&nbsp;&nbsp;|&nbsp;&nbsp; linkedin.com/in/alexrivera-sec &nbsp;&nbsp;|&nbsp;&nbsp; "
    "Based in the United States, open to remote &amp; on-site roles",
    contact_style,
))
story.append(HRFlowable(width="100%", thickness=1, color=LINE, spaceAfter=4))

story.append(Paragraph("SUMMARY", section_style))
story.append(Paragraph(
    "Cybersecurity and networking learner building hands-on skill through the Cisco CCNA "
    "curriculum and the Google Cybersecurity Professional Certificate, with daily practice in "
    "Linux, Packet Tracer, and Wireshark. Documents every lab and project in public, including "
    "mistakes and fixes, and is looking for an entry-level SOC Analyst, Network Administrator, "
    "or IT Support role to build on that foundation.",
    body_style,
))

story.append(Paragraph("TECHNICAL SKILLS", section_style))
story.append(Paragraph(
    "<b>Networking:</b> IPv4/IPv6 addressing &amp; subnetting, VLANs &amp; trunking, static &amp; "
    "dynamic routing, switching, NAT/PAT, ACLs", body_style))
story.append(Paragraph(
    "<b>Security:</b> CIA triad &amp; security frameworks, risk management basics, SIEM "
    "fundamentals, packet/traffic analysis (Wireshark), authentication &amp; access control", body_style))
story.append(Paragraph(
    "<b>Systems &amp; Tools:</b> Linux command line, Packet Tracer, Wireshark, Git/GitHub, Bash", body_style))
story.append(Paragraph(
    "<b>Programming:</b> Python (learning), JavaScript, TypeScript, React, Next.js", body_style))

story.append(Paragraph("PROJECTS", section_style))
projects = [
    ("Home Lab Network Segmentation with VLANs", "Packet Tracer \u00b7 2026",
     "Segmented a flat network into 3 VLANs with router-on-a-stick inter-VLAN routing; documented full configuration and verification."),
    ("Packet-Level Analysis of a TCP Handshake &amp; DNS Query", "Wireshark \u00b7 2026",
     "Captured and analyzed live traffic, mapping each frame to the OSI and TCP/IP models."),
    ("Linux Log Monitor", "Python, Bash \u00b7 2026",
     "Built a script that parses auth.log and flags repeated failed SSH attempts from the same source IP."),
]
for title, meta, desc in projects:
    story.append(Paragraph(title, item_title_style))
    story.append(Paragraph(meta, item_meta_style))
    story.append(Paragraph(desc, bullet_style))
    story.append(Spacer(1, 4))

story.append(Paragraph("CERTIFICATIONS &amp; COURSEWORK", section_style))
certs = [
    ("Cisco CCNA", "In progress \u2014 Cisco Official Curriculum + Jeremy's IT Lab, Module 8 of 17"),
    ("Google Cybersecurity Professional Certificate", "In progress \u2014 Course 2 of 8"),
    ("Linux Essentials", "Self-paced \u2014 command line, permissions, shell scripting"),
]
for title, meta in certs:
    story.append(Paragraph(title, item_title_style))
    story.append(Paragraph(meta, item_meta_style))

story.append(Paragraph("EDUCATION", section_style))
story.append(Paragraph("Self-directed technical study \u2014 networking, security, and systems administration", body_style))
story.append(Paragraph(
    "<i>This is a sample resume generated for the portfolio template. Replace public/resume.pdf "
    "with your own.</i>", item_meta_style))

doc.build(story)
print("done")
