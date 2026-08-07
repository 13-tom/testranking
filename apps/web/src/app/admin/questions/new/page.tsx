import { Card } from "@/components/ui/card";
import { QuestionCreateForm } from "@/features/admin-questions/question-create-form";

export default function AdminQuestionNewPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">New Question</h1>
      <Card>
        <QuestionCreateForm />
      </Card>
    </div>
  );
}
