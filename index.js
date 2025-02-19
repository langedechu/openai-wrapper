const openai = require("openai");
const readline = require("readline");
const fs = require("node:fs");
const process = require("node:process");
const dotenv = require("dotenv");
require("colors");

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/** @type { import("openai/resources/index.mjs").ChatCompletionMessageParam[] } */
const chat = JSON.parse(fs.readFileSync("chat.json", "utf8"));

chat.forEach((message) => {
  console.log(`${message.role.bgCyan.white}: ${message.content.grey}`);
});

const ai = new openai.OpenAI(process.env.OPENAI_API_KEY);

/**
 * @param {string} question
 * @param {string} model
 * @returns
 */
const ask = async (question, model) => {
  chat.push({ role: "user", content: question });

  const response = await ai.chat.completions.create({
    model: model,
    messages: chat,
  });

  return response.choices[0].message.content.trim();
};

/**
 * @param {string} model
 */
const chatLoop = async (model) => {
  rl.question("You".green + ": ", async (input) => {
    if (input === "/exit") {
      rl.close();
      return;
    }

    const response = await ask(input, model);

    console.log(`\n${"Assistant".yellow}: ${response.gray}\n`);

    chat.push({ role: "assistant", content: response });

    chatLoop(model);
  });
};

const models = ["gpt-3.5-turbo", "gpt-4o-mini"];

const selectModel = async () => {
  console.log(
    `Select a model:

${models.map((model, index) => `  ${index + 1}. ${model.green}`).join("\n")}
`
  );

  rl.question("Model".magenta + ": ", async (input) => {
    const selection = parseInt(input);

    if (isNaN(selection) || selection < 1 || selection > models.length) {
      console.clear();

      console.log(
        `${"Invalid model. Please retry or type ".red + "/exit".yellow}.
`
      );
      selectModel();
      return;
    }

    const model = models[selection - 1];

    console.clear();
    chatLoop(model);
  });
};

console.clear();
selectModel();
