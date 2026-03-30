from decimal import Decimal

from core.db import Base, engine, SessionLocal

from modules.users.models import User
from modules.campaigns.models import Campaign
from modules.contributions.models import Contribution
from modules.refunds.models import Refund
from modules.ledger.models import LedgerEntry, Account
from modules.vouches.models import Vouch
from modules.disbursements.models import Disbursement
from modules.system.models import FailedTransaction, IdempotencyKey

from domain.enums import CampaignStatus, ContributionStatus, TransactionStatus, EntryType


def create_tables():
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


def seed_demo_data():
    db = SessionLocal()

    try:
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("Demo data already exists. Skipping seed.")
            return

        demo_password_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gHR.9XzS.6"

        users = [
            User(
                id=1,
                phone_number="254712345678",
                email="admin@lipatrust.com",
                hashed_password=demo_password_hash,
                is_admin=True,
                is_active=True
            ),
            User(
                id=2,
                phone_number="254722222222",
                email="jane.doe@example.com",
                hashed_password=demo_password_hash,
                is_admin=False,
                is_active=True
            ),
            User(
                id=3,
                phone_number="254733333333",
                email="mike.smith@example.com",
                hashed_password=demo_password_hash,
                is_admin=False,
                is_active=True
            ),
            User(
                id=4,
                phone_number="254744444444",
                email="grace.wanjiku@example.com",
                hashed_password=demo_password_hash,
                is_admin=False,
                is_active=True
            ),
            User(
                id=5,
                phone_number="254755555555",
                email="peter.omondi@example.com",
                hashed_password=demo_password_hash,
                is_admin=False,
                is_active=True
            ),
            User(
                id=6,
                phone_number="254766666666",
                email="fatuma.hassan@example.com",
                hashed_password=demo_password_hash,
                is_admin=False,
                is_active=True
            ),
            User(
                id=7,
                phone_number="254777777777",
                email="david.kimani@example.com",
                hashed_password=demo_password_hash,
                is_admin=False,
                is_active=True
            ),
            User(
                id=8,
                phone_number="254788888888",
                email="lucy.mwangi@example.com",
                hashed_password=demo_password_hash,
                is_admin=False,
                is_active=True
            ),
            User(
                id=9,
                phone_number="254799999999",
                email="inactive.user@example.com",
                hashed_password=demo_password_hash,
                is_admin=False,
                is_active=False
            ),
            User(
                id=10,
                phone_number="254700000000",
                email="support@lipatrust.com",
                hashed_password=demo_password_hash,
                is_admin=True,
                is_active=True
            ),
        ]
        db.add_all(users)
        db.flush()
        print("Created 10 demo users")

        accounts = [
            Account(id=1, name="PLATFORM_COLLECTION"),
            Account(id=2, name="CAMPAIGN_ESCROW"),
            Account(id=3, name="DISBURSEMENT_SETTLEMENT"),
            Account(id=4, name="REFUND_RESERVE"),
            Account(id=5, name="PLATFORM_FEES"),
        ]
        db.add_all(accounts)
        db.flush()
        print("Created 5 demo accounts")

        campaigns = [
            Campaign(
                id=1,
                owner_id=2,
                title="Medical Fund for Baby Aisha",
                description="Support Baby Aisha who needs an urgent heart surgery. We are raising funds to cover the specialized treatment and travel costs.",
                target_amount=Decimal("2500000.00"),
                current_amount=Decimal("1875000.00"),
                status=CampaignStatus.ACTIVE,
                paybill_number="222111",
                account_reference="AISHA-HEART",
                is_verified=True
            ),
            Campaign(
                id=2,
                owner_id=3,
                title="Clean Water for Kajiado Village",
                description="A community project to drill a borehole and install solar pumps to provide clean, sustainable water to over 500 households.",
                target_amount=Decimal("800000.00"),
                current_amount=Decimal("800000.00"),
                status=CampaignStatus.COMPLETED,
                paybill_number="333444",
                account_reference="KAJIADO-WATER",
                is_verified=True
            ),
            Campaign(
                id=3,
                owner_id=2,
                title="RenewTech Innovation Hub",
                description="Empowering local engineers with tools and workspace to build renewable energy solutions for rural Kenya.",
                target_amount=Decimal("500000.00"),
                current_amount=Decimal("0.00"),
                status=CampaignStatus.DRAFT,
                paybill_number="555666",
                account_reference="RENEWTECH-2026",
                is_verified=False
            ),
            Campaign(
                id=4,
                owner_id=4,
                title="Kibera School Renovation",
                description="Help us renovate the Kibera Primary School to provide better learning facilities for over 800 students. Funds will go towards new desks, roofing, and sanitation.",
                target_amount=Decimal("1500000.00"),
                current_amount=Decimal("450000.00"),
                status=CampaignStatus.ACTIVE,
                paybill_number="444555",
                account_reference="KIBERA-SCHOOL",
                is_verified=True
            ),
            Campaign(
                id=5,
                owner_id=5,
                title="Emergency Food Relief - Turkana",
                description="Drought has affected thousands of families in Turkana. We are mobilizing to provide food packages and clean water to the most vulnerable communities.",
                target_amount=Decimal("3000000.00"),
                current_amount=Decimal("2100000.00"),
                status=CampaignStatus.ACTIVE,
                paybill_number="666777",
                account_reference="TURKANA-FOOD",
                is_verified=True
            ),
            Campaign(
                id=6,
                owner_id=6,
                title="Wheelchair for John Mwangi",
                description="John lost his mobility after an accident. Help us get him a motorized wheelchair so he can regain his independence and continue his tailoring business.",
                target_amount=Decimal("150000.00"),
                current_amount=Decimal("150000.00"),
                status=CampaignStatus.COMPLETED,
                paybill_number="777888",
                account_reference="JOHN-CHAIR",
                is_verified=True
            ),
            Campaign(
                id=7,
                owner_id=7,
                title="Youth Football Academy Equipment",
                description="Supporting underprivileged youth through football. We need to purchase boots, jerseys, and training equipment for 50 young players in Mathare.",
                target_amount=Decimal("250000.00"),
                current_amount=Decimal("75000.00"),
                status=CampaignStatus.ACTIVE,
                paybill_number="888999",
                account_reference="YOUTH-FOOTBALL",
                is_verified=True
            ),
            Campaign(
                id=8,
                owner_id=8,
                title="Cancer Treatment for Mama Njeri",
                description="Mama Njeri has been diagnosed with breast cancer and needs chemotherapy treatment at Kenyatta National Hospital. Every contribution helps save her life.",
                target_amount=Decimal("1200000.00"),
                current_amount=Decimal("960000.00"),
                status=CampaignStatus.ACTIVE,
                paybill_number="123456",
                account_reference="MAMA-NJERI",
                is_verified=True
            ),
            Campaign(
                id=9,
                owner_id=4,
                title="Solar Lights for Samburu Schools",
                description="Bring solar-powered lights to 10 schools in Samburu County, enabling students to study after sunset and improving education outcomes.",
                target_amount=Decimal("600000.00"),
                current_amount=Decimal("180000.00"),
                status=CampaignStatus.ACTIVE,
                paybill_number="234567",
                account_reference="SAMBURU-SOLAR",
                is_verified=True
            ),
            Campaign(
                id=10,
                owner_id=5,
                title="Failed Campaign Example",
                description="This campaign did not reach its goal and has been marked as failed for refund processing.",
                target_amount=Decimal("500000.00"),
                current_amount=Decimal("50000.00"),
                status=CampaignStatus.FAILED,
                paybill_number="345678",
                account_reference="FAILED-DEMO",
                is_verified=True
            ),
            Campaign(
                id=11,
                owner_id=6,
                title="Refund Pending Campaign",
                description="This campaign is in the process of refunding contributors.",
                target_amount=Decimal("200000.00"),
                current_amount=Decimal("85000.00"),
                status=CampaignStatus.REFUND_PENDING,
                paybill_number="456789",
                account_reference="REFUND-DEMO",
                is_verified=True
            ),
            Campaign(
                id=12,
                owner_id=7,
                title="Paused Campaign - Under Review",
                description="This campaign has been temporarily paused for verification.",
                target_amount=Decimal("400000.00"),
                current_amount=Decimal("120000.00"),
                status=CampaignStatus.PAUSED,
                paybill_number="567890",
                account_reference="PAUSED-DEMO",
                is_verified=False
            ),
        ]
        db.add_all(campaigns)
        db.flush()
        print("Created 12 demo campaigns")

        contributions = [
            Contribution(id=1, campaign_id=1, user_id=3, amount=Decimal("5000.00"), mpesa_receipt="RCD123XRT4", status=ContributionStatus.COMPLETED),
            Contribution(id=2, campaign_id=1, user_id=1, amount=Decimal("10000.00"), mpesa_receipt="RCD456YUI9", status=ContributionStatus.COMPLETED),
            Contribution(id=3, campaign_id=1, user_id=4, amount=Decimal("50000.00"), mpesa_receipt="RCD789ABC1", status=ContributionStatus.COMPLETED),
            Contribution(id=4, campaign_id=1, user_id=5, amount=Decimal("100000.00"), mpesa_receipt="RCD012DEF2", status=ContributionStatus.COMPLETED),
            Contribution(id=5, campaign_id=1, user_id=6, amount=Decimal("25000.00"), mpesa_receipt="RCD345GHI3", status=ContributionStatus.COMPLETED),
            Contribution(id=6, campaign_id=1, user_id=7, amount=Decimal("500000.00"), mpesa_receipt="RCD678JKL4", status=ContributionStatus.COMPLETED),
            Contribution(id=7, campaign_id=1, user_id=8, amount=Decimal("1000000.00"), mpesa_receipt="RCD901MNO5", status=ContributionStatus.COMPLETED),
            Contribution(id=8, campaign_id=1, user_id=3, amount=Decimal("185000.00"), mpesa_receipt="RCD234PQR6", status=ContributionStatus.COMPLETED),
            Contribution(id=9, campaign_id=2, user_id=2, amount=Decimal("300000.00"), mpesa_receipt="RCD789OPA1", status=ContributionStatus.COMPLETED),
            Contribution(id=10, campaign_id=2, user_id=4, amount=Decimal("200000.00"), mpesa_receipt="RCD567STU7", status=ContributionStatus.COMPLETED),
            Contribution(id=11, campaign_id=2, user_id=5, amount=Decimal("150000.00"), mpesa_receipt="RCD890VWX8", status=ContributionStatus.COMPLETED),
            Contribution(id=12, campaign_id=2, user_id=6, amount=Decimal("150000.00"), mpesa_receipt="RCD123YZA9", status=ContributionStatus.COMPLETED),
            Contribution(id=13, campaign_id=4, user_id=2, amount=Decimal("100000.00"), mpesa_receipt="RCD456BCD0", status=ContributionStatus.COMPLETED),
            Contribution(id=14, campaign_id=4, user_id=3, amount=Decimal("150000.00"), mpesa_receipt="RCD789EFG1", status=ContributionStatus.COMPLETED),
            Contribution(id=15, campaign_id=4, user_id=7, amount=Decimal("100000.00"), mpesa_receipt="RCD012HIJ2", status=ContributionStatus.COMPLETED),
            Contribution(id=16, campaign_id=4, user_id=8, amount=Decimal("100000.00"), mpesa_receipt="RCD345KLM3", status=ContributionStatus.COMPLETED),
            Contribution(id=17, campaign_id=5, user_id=1, amount=Decimal("500000.00"), mpesa_receipt="RCD678NOP4", status=ContributionStatus.COMPLETED),
            Contribution(id=18, campaign_id=5, user_id=2, amount=Decimal("300000.00"), mpesa_receipt="RCD901QRS5", status=ContributionStatus.COMPLETED),
            Contribution(id=19, campaign_id=5, user_id=4, amount=Decimal("400000.00"), mpesa_receipt="RCD234TUV6", status=ContributionStatus.COMPLETED),
            Contribution(id=20, campaign_id=5, user_id=6, amount=Decimal("500000.00"), mpesa_receipt="RCD567WXY7", status=ContributionStatus.COMPLETED),
            Contribution(id=21, campaign_id=5, user_id=8, amount=Decimal("400000.00"), mpesa_receipt="RCD890ZAB8", status=ContributionStatus.COMPLETED),
            Contribution(id=22, campaign_id=6, user_id=3, amount=Decimal("50000.00"), mpesa_receipt="RCD123CDE9", status=ContributionStatus.COMPLETED),
            Contribution(id=23, campaign_id=6, user_id=5, amount=Decimal("50000.00"), mpesa_receipt="RCD456FGH0", status=ContributionStatus.COMPLETED),
            Contribution(id=24, campaign_id=6, user_id=7, amount=Decimal("50000.00"), mpesa_receipt="RCD789IJK1", status=ContributionStatus.COMPLETED),
            Contribution(id=25, campaign_id=7, user_id=2, amount=Decimal("25000.00"), mpesa_receipt="RCD012LMN2", status=ContributionStatus.COMPLETED),
            Contribution(id=26, campaign_id=7, user_id=4, amount=Decimal("25000.00"), mpesa_receipt="RCD345OPQ3", status=ContributionStatus.COMPLETED),
            Contribution(id=27, campaign_id=7, user_id=6, amount=Decimal("25000.00"), mpesa_receipt="RCD678RST4", status=ContributionStatus.COMPLETED),
            Contribution(id=28, campaign_id=8, user_id=1, amount=Decimal("200000.00"), mpesa_receipt="RCD901UVW5", status=ContributionStatus.COMPLETED),
            Contribution(id=29, campaign_id=8, user_id=3, amount=Decimal("300000.00"), mpesa_receipt="RCD234XYZ6", status=ContributionStatus.COMPLETED),
            Contribution(id=30, campaign_id=8, user_id=5, amount=Decimal("200000.00"), mpesa_receipt="RCD567ABC7", status=ContributionStatus.COMPLETED),
            Contribution(id=31, campaign_id=8, user_id=7, amount=Decimal("260000.00"), mpesa_receipt="RCD890DEF8", status=ContributionStatus.COMPLETED),
            Contribution(id=32, campaign_id=9, user_id=2, amount=Decimal("60000.00"), mpesa_receipt="RCD123GHI9", status=ContributionStatus.COMPLETED),
            Contribution(id=33, campaign_id=9, user_id=6, amount=Decimal("60000.00"), mpesa_receipt="RCD456JKL0", status=ContributionStatus.COMPLETED),
            Contribution(id=34, campaign_id=9, user_id=8, amount=Decimal("60000.00"), mpesa_receipt="RCD789MNO1", status=ContributionStatus.COMPLETED),
            Contribution(id=35, campaign_id=10, user_id=3, amount=Decimal("25000.00"), mpesa_receipt="RCD012PQR2", status=ContributionStatus.COMPLETED),
            Contribution(id=36, campaign_id=10, user_id=7, amount=Decimal("25000.00"), mpesa_receipt="RCD345STU3", status=ContributionStatus.COMPLETED),
            Contribution(id=37, campaign_id=11, user_id=4, amount=Decimal("35000.00"), mpesa_receipt="RCD678VWX4", status=ContributionStatus.COMPLETED),
            Contribution(id=38, campaign_id=11, user_id=5, amount=Decimal("50000.00"), mpesa_receipt="RCD901YZA5", status=ContributionStatus.REFUNDED),
            Contribution(id=39, campaign_id=12, user_id=2, amount=Decimal("60000.00"), mpesa_receipt="RCD234BCD6", status=ContributionStatus.COMPLETED),
            Contribution(id=40, campaign_id=12, user_id=8, amount=Decimal("60000.00"), mpesa_receipt="RCD567EFG7", status=ContributionStatus.COMPLETED),
            Contribution(id=41, campaign_id=1, user_id=4, amount=Decimal("10000.00"), checkout_request_id="ws_CO_DMZ_123456789", status=ContributionStatus.PENDING),
            Contribution(id=42, campaign_id=5, user_id=3, amount=Decimal("5000.00"), checkout_request_id="ws_CO_DMZ_987654321", status=ContributionStatus.FAILED),
        ]
        db.add_all(contributions)
        db.flush()
        print("Created 42 demo contributions")

        ledger_entries = [
            LedgerEntry(campaign_id=1, reference_id="RCD123XRT4", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("5000.00")),
            LedgerEntry(campaign_id=1, reference_id="RCD456YUI9", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("10000.00")),
            LedgerEntry(campaign_id=1, reference_id="RCD789ABC1", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("50000.00")),
            LedgerEntry(campaign_id=1, reference_id="RCD012DEF2", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("100000.00")),
            LedgerEntry(campaign_id=1, reference_id="RCD345GHI3", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("25000.00")),
            LedgerEntry(campaign_id=1, reference_id="RCD678JKL4", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("500000.00")),
            LedgerEntry(campaign_id=1, reference_id="RCD901MNO5", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("1000000.00")),
            LedgerEntry(campaign_id=1, reference_id="RCD234PQR6", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("185000.00")),
            LedgerEntry(campaign_id=2, reference_id="RCD789OPA1", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("300000.00")),
            LedgerEntry(campaign_id=2, reference_id="RCD567STU7", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("200000.00")),
            LedgerEntry(campaign_id=2, reference_id="RCD890VWX8", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("150000.00")),
            LedgerEntry(campaign_id=2, reference_id="RCD123YZA9", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("150000.00")),
            LedgerEntry(campaign_id=2, reference_id="DISB-C2-001", account="PLATFORM_COLLECTION", entry_type=EntryType.DEBIT, amount=Decimal("800000.00")),
            LedgerEntry(campaign_id=2, reference_id="DISB-C2-001", account="CAMPAIGN_ESCROW", entry_type=EntryType.CREDIT, amount=Decimal("800000.00")),
            LedgerEntry(campaign_id=2, reference_id="AG_DISB_778899", account="CAMPAIGN_ESCROW", entry_type=EntryType.DEBIT, amount=Decimal("800000.00")),
            LedgerEntry(campaign_id=2, reference_id="AG_DISB_778899", account="DISBURSEMENT_SETTLEMENT", entry_type=EntryType.CREDIT, amount=Decimal("800000.00")),
            LedgerEntry(campaign_id=5, reference_id="RCD678NOP4", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("500000.00")),
            LedgerEntry(campaign_id=5, reference_id="RCD901QRS5", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("300000.00")),
            LedgerEntry(campaign_id=5, reference_id="RCD234TUV6", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("400000.00")),
            LedgerEntry(campaign_id=5, reference_id="RCD567WXY7", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("500000.00")),
            LedgerEntry(campaign_id=5, reference_id="RCD890ZAB8", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("400000.00")),
            LedgerEntry(campaign_id=6, reference_id="RCD123CDE9", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("50000.00")),
            LedgerEntry(campaign_id=6, reference_id="RCD456FGH0", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("50000.00")),
            LedgerEntry(campaign_id=6, reference_id="RCD789IJK1", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("50000.00")),
            LedgerEntry(campaign_id=6, reference_id="DISB-C6-001", account="PLATFORM_COLLECTION", entry_type=EntryType.DEBIT, amount=Decimal("150000.00")),
            LedgerEntry(campaign_id=6, reference_id="DISB-C6-001", account="CAMPAIGN_ESCROW", entry_type=EntryType.CREDIT, amount=Decimal("150000.00")),
            LedgerEntry(campaign_id=8, reference_id="RCD901UVW5", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("200000.00")),
            LedgerEntry(campaign_id=8, reference_id="RCD234XYZ6", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("300000.00")),
            LedgerEntry(campaign_id=8, reference_id="RCD567ABC7", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("200000.00")),
            LedgerEntry(campaign_id=8, reference_id="RCD890DEF8", account="PLATFORM_COLLECTION", entry_type=EntryType.CREDIT, amount=Decimal("260000.00")),
            LedgerEntry(campaign_id=11, reference_id="REFUND-C11-001", account="PLATFORM_COLLECTION", entry_type=EntryType.DEBIT, amount=Decimal("50000.00")),
            LedgerEntry(campaign_id=11, reference_id="REFUND-C11-001", account="REFUND_RESERVE", entry_type=EntryType.CREDIT, amount=Decimal("50000.00")),
        ]
        db.add_all(ledger_entries)
        db.flush()
        print("Created 32 demo ledger entries")

        disbursements = [
            Disbursement(
                campaign_id=2,
                amount=Decimal("800000.00"),
                status=TransactionStatus.COMPLETED,
                conversation_id="AG_DISB_778899"
            ),
            Disbursement(
                campaign_id=6,
                amount=Decimal("150000.00"),
                status=TransactionStatus.PROCESSING,
                conversation_id="AG_DISB_112233"
            ),
        ]
        db.add_all(disbursements)
        db.flush()
        print("Created 2 demo disbursements")

        refunds = [
            Refund(
                contribution_id=38,
                amount=Decimal("50000.00"),
                status=TransactionStatus.COMPLETED,
                attempts=1
            ),
            Refund(
                contribution_id=35,
                amount=Decimal("25000.00"),
                status=TransactionStatus.PENDING,
                attempts=0
            ),
            Refund(
                contribution_id=36,
                amount=Decimal("25000.00"),
                status=TransactionStatus.PENDING,
                attempts=0
            ),
            Refund(
                contribution_id=37,
                amount=Decimal("35000.00"),
                status=TransactionStatus.PROCESSING,
                attempts=1
            ),
        ]
        db.add_all(refunds)
        db.flush()
        print("Created 4 demo refunds")

        db.commit()
        print("\n" + "=" * 50)
        print("Demo data seeded successfully!")
        print("=" * 50)
        print("\nLogin credentials (password: LipaTrust2026):")
        print("-" * 50)
        print("  Admin 1:    254712345678 (admin@lipatrust.com)")
        print("  Admin 2:    254700000000 (support@lipatrust.com)")
        print("  User Jane:  254722222222 (jane.doe@example.com)")
        print("  User Mike:  254733333333 (mike.smith@example.com)")
        print("  User Grace: 254744444444 (grace.wanjiku@example.com)")
        print("  User Peter: 254755555555 (peter.omondi@example.com)")
        print("  User Fatuma:254766666666 (fatuma.hassan@example.com)")
        print("  User David: 254777777777 (david.kimani@example.com)")
        print("  User Lucy:  254788888888 (lucy.mwangi@example.com)")
        print("-" * 50)
        print("\nData summary:")
        print(f"  Users: 10 (2 admins, 7 active users, 1 inactive)")
        print(f"  Campaigns: 12 (6 active, 2 completed, 1 draft, 1 failed, 1 refund pending, 1 paused)")
        print(f"  Contributions: 42 (39 completed, 1 pending, 1 failed, 1 refunded)")
        print(f"  Ledger Entries: 32")
        print(f"  Disbursements: 2 (1 completed, 1 processing)")
        print(f"  Refunds: 4 (1 completed, 2 pending, 1 processing)")

    except Exception as e:
        db.rollback()
        print(f"Error seeding demo data: {e}")
        raise
    finally:
        db.close()


def reset_and_seed():
    """Drop all tables, recreate them, and seed demo data."""
    Base.metadata.drop_all(bind=engine)
    print("All tables dropped")
    create_tables()
    seed_demo_data()


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "seed":
            seed_demo_data()
        elif command == "reset":
            reset_and_seed()
        else:
            print(f"Unknown command: {command}")
            print("Usage: python create_tables.py [seed|reset]")
    else:
        create_tables()