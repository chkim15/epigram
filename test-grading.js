// Test script for grading API
// Run with: node test-grading.js

async function testGrading() {
  const testCases = [
    {
      userAnswer: "1/2",
      correctAnswer: "0.5",
      expected: true,
      description: "Fraction vs decimal"
    },
    {
      userAnswer: "3.14159",
      correctAnswer: "π",
      expected: true,
      description: "Pi approximation"
    },
    {
      userAnswer: "2*pi",
      correctAnswer: "2π",
      expected: true,
      description: "Different pi notations"
    },
    {
      userAnswer: "(a)",
      correctAnswer: "A",
      expected: true,
      description: "Multiple choice case insensitive"
    },
    {
      userAnswer: "[0,2)",
      correctAnswer: "[0, 2)",
      expected: true,
      description: "Interval notation with spaces"
    },
    {
      userAnswer: "e^2",
      correctAnswer: "exp(2)",
      expected: true,
      description: "Exponential notations"
    },
    {
      userAnswer: "5",
      correctAnswer: "\\boxed{5}",
      expected: true,
      description: "LaTeX boxed answer"
    },
    {
      userAnswer: "10",
      correctAnswer: "5",
      expected: false,
      description: "Wrong answer"
    }
  ];

  console.log("Testing Grading API...\n");

  for (const test of testCases) {
    try {
      const response = await fetch("http://localhost:3000/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAnswer: test.userAnswer,
          correctAnswer: test.correctAnswer
        })
      });

      if (!response.ok) {
        console.error(`❌ API Error for "${test.description}": ${response.status}`);
        continue;
      }

      const result = await response.json();
      const passed = result.isCorrect === test.expected;

      console.log(
        `${passed ? "✅" : "❌"} ${test.description}`,
        `\n   User: "${test.userAnswer}" vs Correct: "${test.correctAnswer}"`,
        `\n   Expected: ${test.expected}, Got: ${result.isCorrect}`,
        `\n   Confidence: ${result.confidence}`,
        `\n   Feedback: ${result.feedback}\n`
      );
    } catch (error) {
      console.error(`❌ Error testing "${test.description}":`, error.message);
    }
  }
}

// Run the test
testGrading().catch(console.error);