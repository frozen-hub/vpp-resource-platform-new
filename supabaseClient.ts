
import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables
const env = (import.meta as any).env || {};

// 请将这些替换为您在 Supabase 设置中获取的实际 URL 和 Anon Key
// 如果没有设置环境变量，这里使用一个格式正确的占位符 URL 以防止应用启动崩溃
// The URL must start with https://
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
