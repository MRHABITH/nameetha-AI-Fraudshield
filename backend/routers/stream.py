import asyncio
import random
import uuid
from datetime import datetime
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from routers.transactions import _generate_transaction  # reuse generator

router_stream = APIRouter(prefix="/api/v1", tags=["Stream"])


async def _event_generator():
    """Pushes a new AI-scored transaction every 2 seconds via SSE."""
    while True:
        tx = _generate_transaction(offset_seconds=0)
        data = {
            "id": tx["id"],
            "merchant": tx["merchant"]["name"],
            "amount": tx["amount"],
            "currency": tx["currency"],
            "riskScore": tx["riskScore"],
            "riskLevel": tx["riskLevel"],
            "status": tx["status"],
            "location": tx["device"]["location"],
            "timestamp": tx["timestamp"],
        }
        import json
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(0.8)


@router_stream.get("/stream/transactions")
async def stream_transactions():
    """Server-Sent Events endpoint — pushes a live transaction every 2s."""
    return StreamingResponse(
        _event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection":    "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
