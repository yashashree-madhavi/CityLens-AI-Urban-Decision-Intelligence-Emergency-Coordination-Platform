
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.database.database import SessionLocal
from app.services.bmc_weather_service import collect_all_bmc_weather


scheduler = AsyncIOScheduler()


async def collect_bmc_weather_job():
    db = SessionLocal()

    try:
        result = await collect_all_bmc_weather(db)
        print("BMC weather job completed:", result)

    except Exception as exc:
        db.rollback()
        print("BMC weather job failed:", exc)

    finally:
        db.close()


from datetime import datetime, timedelta

def start_bmc_weather_scheduler():
    if scheduler.running:
        return

    # Schedule the recurring 15-minute interval collection
    scheduler.add_job(
        collect_bmc_weather_job,
        trigger="interval",
        minutes=15,
        id="bmc_weather_collection",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        next_run_time=datetime.now() + timedelta(minutes=15),
    )

    scheduler.start()

    # Run the first collection immediately, rather than waiting 15 minutes.
    scheduler.add_job(
        collect_bmc_weather_job,
        trigger="date",
        id="bmc_weather_initial_collection",
        replace_existing=True,
    )

    print("BMC weather scheduler started: initial collection queued; recurring every 15 minutes.")
