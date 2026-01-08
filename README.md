# Qwen Code Examples

This repository contains a collection of practical examples and best practices for **Qwen Code**, designed to help developers leverage the power of Qwen-based models in their workflows.

The project includes examples for:

- **Custom Commands**: Tailored command-line interactions for specific tasks.
- **Custom Skills**: Specialized toolsets for complex workflows (e.g., image generation, content extraction).
- **SDK Usage**: Practical code snippets showing how to integrate Qwen Code SDKs into your projects.

## Project Structure

```text
.
├── sdk/                # SDK usage examples and integration patterns
├── skills/             # Custom skills for various tasks
│   ├── image-generate/ # AI image generation using DashScope
│   └── youtube-transcript-extractor/ # Extracting transcripts from YouTube
├── vibe/               # Marketing materials and brochures for Qwen Code
│   └── brochure/       # Introduction brochures in multiple languages
└── README.md
```

## Featured Skills

### 1. YouTube Transcript Extractor

Extracts timestamped transcripts from YouTube videos for translation, summarization, and content creation.

- **Location**: `skills/youtube-transcript-extractor/`
- **Key Features**: Auto-language detection, timestamp formatting, and local file saving.

### 2. Image Generation Skill

Generates high-quality images from text descriptions using Alibaba Cloud's DashScope (Wanx).

- **Location**: `skills/image-generate/`
- **Key Features**: Smart prompt optimization for hand-drawn styles and automated asset management.

## Marketing Materials

### Qwen Code Brochures

Professional brochures introducing Qwen Code features and capabilities in multiple languages.

- **Location**: `vibe/brochure/`
- **Contents**:
  - `qwen-code.html` - Chinese version of the introduction brochure
  - `qwen-code.en.html` - English version of the introduction brochure

## Getting Started

### Prerequisites

- Python 3.9+ (for Python-based skills)
- Node.js (for JavaScript-based skills)
- API Keys (as required by specific skills, e.g., `DASHSCOPE_API_KEY`)

### Installation

Clone the repository and install dependencies for the specific skill you want to use:

```bash
git clone https://github.com/your-username/qwen-code-examples.git
cd qwen-code-examples
```

Refer to the `SKILL.md` file within each skill directory for detailed setup instructions.

## Contributing

We welcome contributions! If you have a Qwen Code use case or example you'd like to share, feel free to open a Pull Request.

## License

MIT License
