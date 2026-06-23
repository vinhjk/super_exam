export interface ParsedQuestion {
  text: string;
  type: "single" | "multi" | "essay";
  options: string[] | null;
  correctAnswers: number[] | null;
}

export function parseAikenText(text: string): ParsedQuestion[] {
  if (!text || !text.trim()) return [];

  // Split text into blocks by double newlines or multiple empty lines
  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  const parsedQuestions: ParsedQuestion[] = [];

  for (const block of blocks) {
    const lines = block.split(/\n/).map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length === 0) continue;

    const questionText = lines[0];
    const optionLines = lines.slice(1);

    const options: string[] = [];
    const correctAnswers: number[] = [];

    // Regex to match: optional asterisk (*), choice letter (A-Z), dot/parenthesis separator, and option text
    // E.g., "*A. Option content" or "B) Option content"
    const optionRegex = /^(\*?)([A-Z])[\.\)]\s*(.*)$/;
    let isChoiceQuestion = true;

    for (const optLine of optionLines) {
      const match = optLine.match(optionRegex);
      if (!match) {
        // If one of the subsequent lines does not match option format, we assume this is not a clean MCQ block
        // unless it's just blank lines. But let's check if we want to tolerate it or treat it as essay.
        // For standard Aiken, if we find any non-option line after the question, we check if it is just essay text.
        isChoiceQuestion = false;
        break;
      }
    }

    if (isChoiceQuestion && optionLines.length > 0) {
      optionLines.forEach((optLine, index) => {
        const match = optLine.match(optionRegex)!;
        const hasAsterisk = match[1] === "*";
        const optionContent = match[3].trim();
        
        options.push(optionContent);
        if (hasAsterisk) {
          correctAnswers.push(index);
        }
      });

      const type = correctAnswers.length > 1 ? "multi" : "single";

      parsedQuestions.push({
        text: questionText,
        type,
        options,
        correctAnswers,
      });
    } else {
      // Treat as Essay (Tự luận) if no option lines matched
      parsedQuestions.push({
        text: block, // Use the entire block as the essay prompt if it was multi-line without options
        type: "essay",
        options: null,
        correctAnswers: null,
      });
    }
  }

  return parsedQuestions;
}
