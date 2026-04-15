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
}

export interface Review {
  id: number;
  claw_id: number;
  nickname: string;
  rating: number;
  content: string;
  created_at: string;
}
