import type { Question } from "@/lib/questions";

type Props = {
  question: Question;
  selected: string | null;
  showFeedback: boolean;
  onAnswer: (option: string) => void;
};

// Тип А — выбор из 4 вариантов, Тип Б — выбор из 2 похожих слов
export function QuestionCard({ question, selected, showFeedback, onAnswer }: Props) {
  return (
    <>
      <div className="text-center space-y-1">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          {question.direction === "ky-ru" ? "Кыргызский → Русский" : "Русский → Кыргызский"}
        </span>
        {question.type === "B" && (
          <p className="text-xs text-amber-600 font-medium">Выберите похожий вариант</p>
        )}
      </div>

      <div className="text-center">
        <p className="text-3xl font-bold text-gray-900 leading-tight">{question.prompt}</p>
      </div>

      <div className="grid gap-3 grid-cols-1">
        {question.options.map((option) => {
          let btnClass =
            "w-full py-4 px-5 rounded-2xl text-left text-base font-medium border-2 transition-all duration-200 ";

          if (showFeedback) {
            if (option === question.correctAnswer) {
              btnClass += "bg-green-50 border-green-500 text-green-800";
            } else if (option === selected) {
              btnClass += "bg-red-50 border-red-400 text-red-700";
            } else {
              btnClass += "bg-white border-gray-200 text-gray-400";
            }
          } else {
            btnClass +=
              "bg-white border-gray-200 text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98]";
          }

          return (
            <button
              key={option}
              onClick={() => onAnswer(option)}
              disabled={showFeedback}
              className={btnClass}
            >
              {option}
            </button>
          );
        })}
      </div>
    </>
  );
}
