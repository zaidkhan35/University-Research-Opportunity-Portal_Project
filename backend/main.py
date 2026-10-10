from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import Opportunity  # importing registers the table
from schemas import OpportunityBase, OpportunityOut

Base.metadata.create_all(bind=engine)  # creates the table if it does not exist

app = FastAPI(title="University Research Opportunity Portal")

# Allow the HTML frontend (a different origin) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Validation errors -> 400 (the assignment asks for 400, FastAPI default is 422) ----------
@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    errors = [
        {"field": ".".join(str(part) for part in err["loc"][1:]), "message": err["msg"]}
        for err in exc.errors()
    ]
    return JSONResponse(
        status_code=400,
        content={"detail": "Validation failed", "errors": errors},
    )


def save_changes(db: Session):
    """Commit, and turn any database failure into a clean 500 error."""
    try:
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error. Please try again.")


def get_or_404(db: Session, opportunity_id: int) -> Opportunity:
    opportunity = db.get(Opportunity, opportunity_id)
    if opportunity is None:
        raise HTTPException(status_code=404, detail="Research opportunity not found")
    return opportunity


# ---------- 1. CREATE ----------
@app.post("/api/opportunities", status_code=201, response_model=OpportunityOut)
def create_opportunity(data: OpportunityBase, db: Session = Depends(get_db)):
    opportunity = Opportunity(**data.model_dump())
    db.add(opportunity)          # put in the basket
    save_changes(db)             # save permanently
    db.refresh(opportunity)      # reload to get the generated id
    return opportunity


# ---------- 2. READ ALL ----------
@app.get("/api/opportunities", response_model=list[OpportunityOut])
def get_all_opportunities(db: Session = Depends(get_db)):
    try:
        return db.scalars(select(Opportunity).order_by(Opportunity.id)).all()
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Database error. Please try again.")


# ---------- 3. READ ONE ----------
@app.get("/api/opportunities/{opportunity_id}", response_model=OpportunityOut)
def get_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    return get_or_404(db, opportunity_id)


# ---------- 4. UPDATE (full replacement; also used to change status Open -> Closed) ----------
@app.put("/api/opportunities/{opportunity_id}", response_model=OpportunityOut)
def update_opportunity(opportunity_id: int, data: OpportunityBase, db: Session = Depends(get_db)):
    opportunity = get_or_404(db, opportunity_id)         # 1. find (404 if missing)

    for field, value in data.model_dump().items():       # 2. change every field
        setattr(opportunity, field, value)

    save_changes(db)                                     # 3. save
    db.refresh(opportunity)
    return opportunity


# ---------- 5. DELETE ----------
@app.delete("/api/opportunities/{opportunity_id}")
def delete_opportunity(opportunity_id: int, db: Session = Depends(get_db)):
    opportunity = get_or_404(db, opportunity_id)         # 1. find (404 if missing)
    db.delete(opportunity)                               # 2. mark for deletion
    save_changes(db)                                     # 3. delete permanently
    return {"message": f"Research opportunity {opportunity_id} deleted"}