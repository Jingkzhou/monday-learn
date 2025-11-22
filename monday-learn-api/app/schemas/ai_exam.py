from typing import List, Optional
from pydantic import BaseModel


class ExamQuestion(BaseModel):
    id: str
    text: str
    type: str  # multiple_choice | true_false | written
    options: Optional[List[str]] = None
    correctAnswer: Optional[str] = None


class ExamSection(BaseModel):
    title: str
    description: str
    questions: List[ExamQuestion]


class ExamPaper(BaseModel):
    title: str
    gradeLevel: str
    subject: str
    sections: List[ExamSection]
