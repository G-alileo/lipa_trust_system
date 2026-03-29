from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.routes import auth, campaigns, contributions, payments
from api.routes.admin import campaigns as admin_campaigns
from api.routes.admin import refunds as admin_refunds
from api.routes.admin import surplus as admin_surplus
from api.routes.admin import monitoring as admin_monitoring
from core.config import settings

app = FastAPI(
    title="Lipa Trust System",
    description="Trust-based crowdfunding platform with M-Pesa integration",
    version="1.0.0"
)

allowed_origins = [origin.strip() for origin in settings.FRONTEND_ORIGINS.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "data": None,
            "error": "Internal server error"
        }
    )


app.include_router(auth.router, prefix="/api/v1")
app.include_router(campaigns.router, prefix="/api/v1")
app.include_router(contributions.router, prefix="/api/v1")
app.include_router(payments.router, prefix="/api/v1")
app.include_router(admin_campaigns.router, prefix="/api/v1")
app.include_router(admin_refunds.router, prefix="/api/v1")
app.include_router(admin_surplus.router, prefix="/api/v1")
app.include_router(admin_monitoring.router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", port=8000, reload=True)
