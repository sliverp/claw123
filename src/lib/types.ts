// ======== 顶层板块定义 ========
export type SectionKey = 'claws' | 'skills' | 'frameworks' | 'benchmarks' | 'token-coding-plans';

export interface SectionDef {
  key: SectionKey;
  label: string;
  icon: string;
  description: string;
}

export const SECTIONS: SectionDef[] = [
  { key: 'claws', label: '龙虾整理', icon: '🦞', description: '发现和探索各种 AI 网关 / 代理 / 聚合工具' },
  { key: 'skills', label: 'Skill 市场', icon: '🧩', description: '发现可复用的 AI Skill 插件与能力包' },
  { key: 'frameworks', label: '多 Agent 协作框架', icon: '🤖', description: '探索多 Agent 协作与编排框架' },
  { key: 'benchmarks', label: '龙虾测评', icon: '📊', description: '各类 AI 工具的横向对比与测评' },
  { key: 'token-coding-plans', label: 'Token/Coding Plan', icon: '💳', description: '整理模型 token 定价、编码套餐和相关使用计划' },
];

// ======== Claw（原有，完全不变）========
export interface ClawConfig {
  slug: string;
  name: string;
  description: string;
  category: 'gateway' | 'proxy' | 'aggregator' | 'tool' | 'other';
  homepage: string;
  github: string;
  icon?: string;
  tags?: string[];
}

export interface Claw extends ClawConfig {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface ClawWithStats extends Claw {
  avg_rating: number;
  review_count: number;
  visit_count: number;
}

// ======== Skill 市场 ========
export interface SkillConfig {
  slug: string;
  name: string;
  description: string;
  category: 'prompt' | 'tool-use' | 'workflow' | 'rag' | 'code-gen' | 'other';
  homepage: string;
  github: string;
  icon?: string;
  tags?: string[];
}

export interface Skill extends SkillConfig {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface SkillWithStats extends Skill {
  avg_rating: number;
  review_count: number;
  visit_count: number;
}

// ======== 多 Agent 协作框架 ========
export interface FrameworkConfig {
  slug: string;
  name: string;
  description: string;
  category: 'orchestration' | 'communication' | 'planning' | 'memory' | 'full-stack' | 'other';
  homepage: string;
  github: string;
  icon?: string;
  tags?: string[];
}

export interface Framework extends FrameworkConfig {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface FrameworkWithStats extends Framework {
  avg_rating: number;
  review_count: number;
  visit_count: number;
}

// ======== 龙虾测评 ========
export interface BenchmarkConfig {
  slug: string;
  name: string;
  description: string;
  category: 'gateway-compare' | 'model-compare' | 'agent-compare' | 'tool-compare' | 'other';
  homepage: string;
  github: string;
  icon?: string;
  tags?: string[];
}

export interface Benchmark extends BenchmarkConfig {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface BenchmarkWithStats extends Benchmark {
  avg_rating: number;
  review_count: number;
  visit_count: number;
}

// ======== Token/Coding Plan ========
export interface TokenCodingPlanConfig {
  slug: string;
  name: string;
  description: string;
  category: 'pricing' | 'coding-plan' | 'bundle' | 'comparison' | 'other';
  homepage: string;
  github: string;
  icon?: string;
  tags?: string[];
}

export interface TokenCodingPlan extends TokenCodingPlanConfig {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface TokenCodingPlanWithStats extends TokenCodingPlan {
  avg_rating: number;
  review_count: number;
  visit_count: number;
}

// ======== 通用带统计的 item 类型（各板块通用） ========
export type ItemWithStats = ClawWithStats | SkillWithStats | FrameworkWithStats | BenchmarkWithStats | TokenCodingPlanWithStats;

// ======== Review（共用）========
export interface Review {
  id: number;
  claw_id: number;
  nickname: string;
  rating: number;
  content: string;
  approved: number;
  created_at: string;
}
