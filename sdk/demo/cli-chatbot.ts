/**
 * Qwen Code SDK 交互式命令行聊天机器人示例
 *
 * 本模块演示如何使用 @qwen-code/sdk 的 query API 创建一个交互式命令行聊天应用。
 * 主要功能包括：
 * - 多轮对话：通过异步生成器维护持续的对话流
 * - 流式响应：实时显示 AI 的回复内容
 * - 工具调用：展示 AI 使用工具的过程和结果
 * - 权限控制：通过 canUseTool 回调控制工具使用权限
 */

import {
  isSDKAssistantMessage,
  isSDKPartialAssistantMessage,
  isSDKResultMessage,
  isSDKSystemMessage,
  isSDKUserMessage,
  query,
  type SDKUserMessage,
} from "@qwen-code/sdk";
import * as readline from "readline";

/**
 * 用户输入队列
 * 用于管理异步的用户输入，支持生产者-消费者模式
 */
class UserInputQueue {
  private queue: string[] = [];
  private resolvers: ((value: string) => void)[] = [];
  private closed = false;

  /**
   * 获取下一个用户输入
   * 如果队列为空，会等待直到有新输入到达
   */
  async getNextInput(): Promise<string | null> {
    if (this.closed) {
      return null;
    }

    if (this.queue.length > 0) {
      return this.queue.shift()!;
    }

    return new Promise<string | null>((resolve) => {
      this.resolvers.push(resolve as (value: string) => void);
    });
  }

  /**
   * 添加用户输入到队列
   * 如果有等待中的消费者，直接传递给消费者；否则加入队列
   */
  addInput(input: string) {
    if (this.closed) {
      return;
    }

    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve(input);
    } else {
      this.queue.push(input);
    }
  }

  /**
   * 关闭队列，释放所有等待中的消费者
   */
  close() {
    this.closed = true;
    for (const resolve of this.resolvers) {
      resolve(null as unknown as string);
    }
    this.resolvers = [];
  }
}

/**
 * 创建对话流生成器
 * 这是一个异步生成器，持续从输入队列中读取用户消息并转换为 SDK 所需的格式
 * 生成器会一直运行直到队列关闭
 */
async function* createConversationStream(
  inputQueue: UserInputQueue
): AsyncIterable<SDKUserMessage> {
  const sessionId = crypto.randomUUID();

  while (true) {
    const userInput = await inputQueue.getNextInput();

    if (userInput === null) {
      break;
    }

    yield {
      type: "user",
      session_id: sessionId,
      message: {
        role: "user",
        content: userInput,
      },
      parent_tool_use_id: null,
    } as SDKUserMessage;

    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

/**
 * 聊天机器人主函数
 * 初始化 readline 接口、输入队列和 SDK query 实例，
 * 然后进入消息处理循环，实时显示 AI 的响应
 */
async function chatbot() {
  process.stdout.write("Qwen Code 聊天机器人 (输入 'quit' 退出)\n");
  process.stdout.write("-".repeat(50) + "\n");

  const inputQueue = new UserInputQueue();

  // 创建 readline 接口用于读取用户输入
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // 初始化 SDK query 实例
  // prompt 参数接收一个异步生成器，用于持续提供用户消息
  const q = query({
    prompt: createConversationStream(inputQueue),
    options: {
      // 流式输出，或等待completion完成后输出
      includePartialMessages: true,
      logLevel: "error",
      // 工具权限控制回调：决定是否允许 AI 使用特定工具
      canUseTool: async (toolName, input) => {
        // 示例：仅允许使用 write_file 工具
        if (toolName.toLocaleLowerCase() === "write_file") {
          return {
            behavior: "allow",
            updatedInput: input,
          };
        }
        return {
          behavior: "deny",
          message: "You are not allowed to use this tool",
        };
      },
    },
  });

  // 提示用户输入的函数
  const promptUser = () => {
    rl.question("\n你: \n", (userInput) => {
      if (
        userInput.toLowerCase() === "quit" ||
        userInput.toLowerCase() === "exit" ||
        userInput.toLowerCase() === "q"
      ) {
        process.stdout.write("再见！\n");
        inputQueue.close();
        rl.close();
        return;
      }

      inputQueue.addInput(userInput);
    });
  };

  // 等待 query 初始化完成
  await q.initialized;
  promptUser();

  try {
    let isFirstChunk = true;

    // 处理来自 SDK 的消息流
    for await (const message of q) {
      // 处理系统初始化消息
      if (isSDKSystemMessage(message) && message.subtype === "init") {
        process.stdout.write("Qwen:\n");
        continue;
      } else if (isSDKPartialAssistantMessage(message)) {
        // 处理流式文本响应（实时显示 AI 正在生成的内容）
        if (message.event.type === "content_block_delta") {
          const delta = message.event.delta;
          if (delta.type === "text_delta") {
            if (isFirstChunk) {
              isFirstChunk = false;
            }
            process.stdout.write(delta.text);
          }
        }
      } else if (isSDKAssistantMessage(message)) {
        // 处理完整的助手消息（包含文本和工具调用）
        if (!isFirstChunk) {
          process.stdout.write("\n");
        }

        for (const block of message.message.content) {
          if (block.type === "text") {
            // 显示文本内容（如果未通过流式方式显示）
            if (isFirstChunk) {
              process.stdout.write(block.text + "\n");
            }
          } else if (block.type === "tool_use") {
            // 显示工具调用信息
            process.stdout.write(`\n[Tool Use: ${block.name}]\n`);
            process.stdout.write(
              "Input: " + JSON.stringify(block.input, null, 2) + "\n"
            );
          }
        }

        isFirstChunk = true;
      } else if (isSDKUserMessage(message)) {
        // 处理用户消息（包含工具执行结果）
        const content = message.message.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === "tool_result") {
              process.stdout.write(`\n[Tool Result: ${block.tool_use_id}]\n`);
              if (block.is_error) {
                process.stdout.write("Error: " + block.content + "\n");
              } else {
                const output =
                  typeof block.content === "string"
                    ? block.content
                    : JSON.stringify(block.content, null, 2);
                process.stdout.write("Output: " + output + "\n");
              }
            }
          }
        }
      } else if (isSDKResultMessage(message)) {
        // 处理结果消息（标志一轮对话结束）
        if (message.subtype !== "success") {
          process.stderr.write(
            "\nError: " + (message.error?.message || "Unknown error") + "\n"
          );
        }
        // 显示下一轮输入提示
        promptUser();
      }
    }
  } catch (error) {
    process.stderr.write("Query failed: " + error + "\n");
  } finally {
    await q.close();
    rl.close();
  }
}

chatbot().catch((error) => {
  process.stderr.write("Fatal error: " + error + "\n");
  process.exit(1);
});
