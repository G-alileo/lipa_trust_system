from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from api.routes import auth, campaigns, contributions
from api.routes.admin import campaigns as admin_campaigns
from api.routes.admin import refunds as admin_refunds
from api.routes.admin import surplus as admin_surplus
from api.routes.admin import monitoring as admin_monitoring

app = FastAPI(
    title="Lipa Trust System",
    description="Trust-based crowdfunding platform with M-Pesa integration",
    version="1.0.0"
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
