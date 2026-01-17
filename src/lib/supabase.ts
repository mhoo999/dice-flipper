import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SelectedDice } from '@/store/diceStore';

// Supabase 클라이언트 생성
// 환경변수에서 가져오거나, 직접 설정 가능
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 환경변수가 없으면 더미 클라이언트 생성 (앱이 크래시되지 않도록)
let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  // 더미 URL과 키로 클라이언트 생성 (실제 사용 시 에러 처리)
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

// 주사위 세트 데이터 타입
export interface DiceSet {
  id: string;
  name: string;
  description?: string;
  dice_data: SelectedDice[];
  created_at?: string;
  updated_at?: string;
}

// Supabase 설정 확인
function checkSupabaseConfig() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정해주세요.');
  }
}

// 주사위 세트 저장
export async function saveDiceSet(name: string, dice: SelectedDice[], description?: string): Promise<{ data: DiceSet | null; error: any }> {
  try {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('dice_sets')
      .insert([
        {
          name,
          description: description || null,
          dice_data: dice,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error saving dice set:', error);
      return { data: null, error };
    }

    return { data: data as DiceSet, error: null };
  } catch (error) {
    console.error('Error saving dice set:', error);
    return { data: null, error };
  }
}

// 주사위 세트 불러오기
export async function loadDiceSet(id: string): Promise<{ data: DiceSet | null; error: any }> {
  try {
    checkSupabaseConfig();
  } catch (configError: any) {
    console.error('Supabase config error:', configError);
    return { data: null, error: configError };
  }

  try {
    const { data, error } = await supabase
      .from('dice_sets')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error loading dice set:', error);
      return { data: null, error };
    }

    return { data: data as DiceSet, error: null };
  } catch (error) {
    console.error('Error loading dice set:', error);
    return { data: null, error };
  }
}

// 주사위 세트 업데이트
export async function updateDiceSet(id: string, name: string, dice: SelectedDice[], description?: string): Promise<{ data: DiceSet | null; error: any }> {
  try {
    checkSupabaseConfig();
    const { data, error } = await supabase
      .from('dice_sets')
      .update({
        name,
        description: description || null,
        dice_data: dice,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating dice set:', error);
      return { data: null, error };
    }

    return { data: data as DiceSet, error: null };
  } catch (error) {
    console.error('Error updating dice set:', error);
    return { data: null, error };
  }
}
