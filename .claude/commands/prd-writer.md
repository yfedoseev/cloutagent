# PRD Writer - AI-Powered Product Requirements Document Generator

Intelligently analyze product ideas, conduct deep research, and generate comprehensive Product Requirements Documents through iterative analysis and stakeholder interviews.

## Instructions

1. **Initialize PRD Analysis**
   - Acknowledge the PRD writing request
   - Process input using flexible input handling:

     ### Text Input Processing
     - Accept direct text ideas from user messages
     - Parse and extract key concepts and keywords
     - Identify product domain and initial scope

     ### File Input Processing
     - Accept file paths (relative or absolute)
     - Read file contents using Read tool
     - Support multiple formats: .md, .txt, .doc, .pdf
     - Extract and structure information from files

     ### Interactive Input
     - If no input provided, prompt user for idea description
     - Guide user through initial idea articulation
     - Collect basic context and domain information

   - Begin ultra-deep thinking mode for comprehensive analysis
   - Create initial PRD draft file with timestamp in filename
   - Save immediately to preserve initial context

2. **Deep Idea Analysis Phase**

   ### Ultra-Deep Sequential Thinking Process
   - Initiate sequential thinking tool with estimated 15-25 thoughts
   - Conduct multi-perspective analysis covering:

     **Product Perspective**
     - Core value proposition and unique selling points
     - Primary and secondary user problems being solved
     - Product-market fit assessment
     - Competitive differentiation analysis

     **Technical Perspective**
     - Architecture and implementation feasibility
     - Technology stack considerations and constraints
     - Scalability and performance requirements
     - Integration and API requirements

     **Business Perspective**
     - Revenue model and monetization strategy
     - Market size and addressable market
     - Go-to-market strategy considerations
     - Resource requirements and timeline

     **User Perspective**
     - User journey and experience mapping
     - Pain points and job-to-be-done analysis
     - Adoption barriers and success factors
     - Accessibility and usability requirements

   ### Analysis Output Generation
   - Document all insights from sequential thinking immediately
   - Identify high-priority unclear areas requiring stakeholder input
   - Generate specific, targeted interview questions
   - Create structured multiple choice options for complex decisions
   - Flag areas requiring deep research before proceeding

3. **Stakeholder Interview Process**

   ### Question Generation and Structure
   - Generate 5-10 high-impact clarifying questions based on analysis gaps
   - Structure each question with 4-6 multiple choice options (A, B, C, D, E, F)
   - Include "Other (please specify)" option for uncovered scenarios
   - Provide context and reasoning for why each question matters

   ### Interview Question Categories

     **Target User and Market Questions**
     ```
     Q1: Who is the primary target user for this product?
     A) Individual consumers (B2C)
     B) Small business teams (1-50 employees)
     C) Enterprise organizations (500+ employees)
     D) Developers and technical professionals
     E) Other professional services
     F) Other (please specify)
     ```

     **Problem Validation Questions**
     ```
     Q2: What is the current severity of the problem being solved?
     A) Critical daily pain point affecting productivity
     B) Moderate inconvenience with workaround solutions
     C) Nice-to-have improvement for efficiency
     D) Emerging problem without current solutions
     E) Other (please specify)
     ```

     **Solution Approach Questions**
     ```
     Q3: What type of solution architecture do you envision?
     A) Web-based SaaS application
     B) Mobile-first application
     C) Desktop application with cloud sync
     D) API/Platform for integration
     E) Hybrid approach
     F) Other (please specify)
     ```

   ### Interview Execution Protocol
   - Present questions in logical sequence (user → problem → solution → business)
   - Allow detailed explanations beyond multiple choice selections
   - Ask follow-up questions based on responses
   - Probe for edge cases and special requirements
   - Document exact responses and reasoning

   ### Response Processing and Analysis
   - Save all responses immediately to PRD draft
   - Analyze responses for consistency and gaps
   - Identify areas requiring additional clarification
   - Flag responses that trigger need for research
   - Determine if additional interview rounds are needed

   ### Multi-Round Interview Strategy
   - **Round 1**: Core concept and user validation
   - **Round 2**: Technical feasibility and architecture
   - **Round 3**: Business model and go-to-market
   - **Round N**: Specific gap resolution based on research findings

4. **Deep Research Phase**

   Execute comprehensive research using all available tools based on product domain and requirements:

   ### Technical Feasibility Research

     **Context7 Integration**
     - Resolve library IDs for relevant frameworks and technologies
     - Retrieve up-to-date documentation for potential tech stack components
     - Research API capabilities and integration patterns
     - Validate technical approach with current best practices

     **DeepWiki Repository Analysis**
     - Research GitHub repositories for similar products and solutions
     - Analyze open source implementations and architecture patterns
     - Study contribution patterns and community engagement
     - Identify potential libraries, frameworks, and tools

     **Cloud Platform Research**
     - **Microsoft Learn**: Azure services, enterprise integration, compliance
     - **AWS Docs**: Cloud architecture, serverless patterns, scaling strategies
     - Research cost models and service limitations
     - Identify security and compliance capabilities

   ### Market and Competitive Research

     **Industry Analysis**
     - **WebSearch**: Market size, growth trends, industry reports
     - **WebSearch**: Competitive landscape and market positioning
     - **WebSearch**: User studies and market research reports
     - **WebSearch**: Regulatory and compliance requirements

     **Competitive Deep Dive**
     - **WebFetch**: Competitor product documentation and feature analysis
     - **WebFetch**: Pricing models and go-to-market strategies
     - **WebFetch**: Customer reviews and feedback analysis
     - **Playwright**: Interactive product exploration and user experience analysis

   ### User and Domain Research

     **User Research**
     - **WebSearch**: User behavior studies in target domain
     - **WebSearch**: Pain point analysis and user feedback
     - **DeepWiki**: Open source projects with similar user bases
     - **WebFetch**: User community discussions and forums

     **Domain-Specific Research**
     - Industry-specific requirements and standards
     - Integration ecosystem and partnership opportunities
     - Security and privacy considerations
     - Accessibility and internationalization requirements

   ### Research Execution Protocol

     **Research Planning**
     - Identify 3-5 key research areas based on interview responses
     - Prioritize research topics by impact on PRD completeness
     - Define specific research questions for each tool
     - Plan research sequence to build on previous findings

     **Information Synthesis**
     - Document all research findings immediately in PRD
     - Cross-reference findings across multiple sources
     - Identify conflicting information requiring additional validation
     - Flag areas where research reveals new questions

     **Research Quality Assurance**
     - Validate information with multiple sources when possible
     - Note source credibility and publication dates
     - Document assumptions and areas of uncertainty
     - Flag areas requiring stakeholder validation

5. **Iterative PRD Development**

   ### Continuous Documentation Strategy
   - **Immediate Capture**: Write all insights to PRD file immediately upon discovery
   - **Context Preservation**: Save after each major phase to prevent information loss
   - **Version Tracking**: Use MultiEdit tool for complex updates to maintain consistency
   - **Progressive Refinement**: Improve content quality in each iteration while preserving all details

   ### PRD File Management

     **File Naming and Structure**
     - Create PRD file with format: `prd-[name]-[timestamp].md`
     - Use Write tool for initial creation, Edit/MultiEdit for updates
     - Maintain backup versions at major milestones
     - Include metadata header with creation date and version history

     **Incremental Writing Process**
     - **Phase 1**: Initial idea and analysis findings
     - **Phase 2**: Interview responses and clarifications
     - **Phase 3**: Research findings by category
     - **Phase 4**: Synthesis and detailed requirements
     - **Phase 5**: Technical specifications and implementation details
     - **Phase 6**: Final polish and validation

   ### Content Organization Strategy

     **Real-Time Updates**
     - Add interview responses immediately after collection
     - Insert research findings into appropriate PRD sections
     - Document decision rationale as choices are made
     - Flag areas requiring additional investigation

     **Information Layering**
     - **Core Content**: Essential requirements and specifications
     - **Supporting Evidence**: Research findings and validation data
     - **Decision History**: Rationale for key choices and trade-offs
     - **Future Considerations**: Items for later phases or versions

   ### Context Management

     **Information Prioritization**
     - Critical requirements and constraints (highest priority)
     - Core user stories and acceptance criteria
     - Technical architecture and implementation approach
     - Supporting research and validation data

     **Content Refinement Process**
     - Consolidate duplicate information across sections
     - Improve clarity and specificity of requirements
     - Enhance technical details with research findings
     - Polish language while preserving all technical details

   ### Quality Assurance During Development

     **Completeness Validation**
     - Cross-reference interview responses with PRD sections
     - Ensure all research findings are incorporated
     - Validate that all unclear areas have been addressed
     - Confirm technical feasibility is documented

     **Consistency Checking**
     - Align requirements across different PRD sections
     - Ensure technical approach matches business requirements
     - Validate that user stories support business objectives
     - Confirm resource estimates align with scope

6. **PRD Quality Assurance**
   - Validate completeness against PRD checklist
   - Ensure technical feasibility is addressed
   - Verify market validation and user research
   - Check for security and scalability considerations
   - Confirm alignment with business objectives

## PRD Document Structure

```markdown
# Product Requirements Document: [Product Name]

## Executive Summary
- Problem statement and solution overview
- Key success metrics and business impact
- High-level timeline and resource requirements

## Market Analysis
- Target audience and user personas
- Market size and opportunity
- Competitive landscape analysis
- Research findings and sources

## Problem Definition
- User pain points and current solutions
- Root cause analysis
- Impact assessment and prioritization

## Solution Overview
- Core value proposition
- Key features and functionality
- User experience principles
- Technical approach and architecture

## Detailed Requirements
### Functional Requirements
- Feature specifications with acceptance criteria
- User stories and use cases
- Integration requirements

### Non-Functional Requirements
- Performance, security, scalability requirements
- Compliance and regulatory considerations
- Accessibility and internationalization

## Technical Specification
- System architecture and design patterns
- Technology stack and dependencies
- Data models and API specifications
- Security and privacy implementation

## Implementation Plan
- Development phases and milestones
- Resource requirements and timeline
- Risk assessment and mitigation
- Success metrics and KPIs

## Research Appendix
- Detailed research findings
- Interview responses and insights
- Technical feasibility analysis
- Market validation data
```

## Usage Examples

```bash
# Create PRD from text idea
/prd-writer "AI-powered code review tool for enterprise teams"

# Create PRD from existing idea file
/prd-writer ./ideas/mobile-app-concept.md

# Interactive PRD development session
/prd-writer
# [Prompt will ask for idea input]
```

## Key Principles

- **Ultra-Deep Analysis**: Use sequential thinking for multi-perspective analysis
- **Research-Driven**: Leverage all available tools for comprehensive research
- **Iterative Development**: Save progress continuously to preserve context
- **Stakeholder-Centered**: Conduct thorough interviews with structured questions
- **Evidence-Based**: Support all assumptions with research and data
- **Technical Feasibility**: Validate technical approach through research
- **Context Preservation**: Write details immediately to avoid loss due to context limits

## Output Expectations

- Comprehensive PRD document with full market and technical analysis
- Multiple interview rounds with stakeholder clarifications
- Deep research across technology, market, and user domains
- Iterative refinement with preserved decision history
- Production-ready specification with implementation guidance
- Research appendix with all sources and findings

## Prerequisites

- Clear product idea or concept (text or file)
- Access to research tools (internet connection required)
- Willingness to participate in clarifying interviews
- Understanding that process may require multiple iterations
- PRD will be saved as markdown file for future reference

## Research Tool Integration

The command leverages these MCP tools for comprehensive research:

- **Sequential Thinking**: Deep multi-perspective analysis
- **Context7**: Technical documentation and library research
- **DeepWiki**: Open source project and repository analysis
- **Microsoft Learn**: Azure and Microsoft technology research
- **AWS Docs**: Cloud architecture and service research
- **WebSearch**: Market trends and competitive intelligence
- **WebFetch**: Detailed competitor and industry analysis
- **Playwright**: Interactive product exploration (when needed)
- **Memory**: Knowledge graph for relationship tracking

## Advanced Features

- **Multi-Round Interviews**: Adaptive questioning based on responses
- **Contextual Research**: Research scope adapts to product domain
- **Incremental Saving**: Preserve all insights to prevent context loss
- **Decision Tracking**: Maintain history of choices and rationale
- **Technical Validation**: Verify feasibility through architectural research
- **Market Validation**: Support assumptions with market data
