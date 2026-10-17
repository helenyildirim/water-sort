import React from 'react';
import { Text, View } from 'react-native';
import { Coin, Icon } from '../art/Icons';
import { DAILY_REWARDS } from '../config';
import { themeById } from '../game/themes';
import { useStore } from '../state/store';
import { hapticSuccess } from '../util/haptics';
import { GameButton, GOLD, ModalCard } from './kit';

export function DailyModal({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const theme = themeById(store.data.theme);
  const { canClaimDaily, data } = store;
  // streak day (1..) that today's claim lands on, or the last claimed day
  const streakDay = canClaimDaily ? streakAfter(store) : data.dailyStreak;
  const todayIdx = (streakDay - 1) % DAILY_REWARDS.length;

  return (
    <ModalCard theme={theme} title="Daily Reward" onClose={onClose} width={340}>
      <Text style={{ color: '#9fb0d0', textAlign: 'center' }}>Come back every day to build a streak and earn more.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginVertical: 4 }}>
        {DAILY_REWARDS.map((r, i) => {
          const claimed = canClaimDaily ? i < todayIdx : i <= todayIdx;
          const today = canClaimDaily && i === todayIdx;
          return (
            <View
              key={i}
              style={{
                width: 68,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: 14,
                backgroundColor: today ? 'rgba(255,196,58,0.22)' : 'rgba(255,255,255,0.07)',
                borderWidth: 2,
                borderColor: today ? GOLD : 'rgba(255,255,255,0.12)',
                opacity: claimed && !today ? 0.6 : 1,
              }}
            >
              <Text style={{ color: '#9fb0d0', fontSize: 11, fontWeight: '800' }}>DAY {i + 1}</Text>
              {claimed && !today ? <Icon name="check" size={26} color="#5be07c" /> : <Coin size={26} />}
              <Text style={{ color: '#fff', fontWeight: '900' }}>{r}</Text>
            </View>
          );
        })}
      </View>
      {canClaimDaily ? (
        <GameButton
          label={`CLAIM +${store.nextDailyReward}`}
          width={250}
          onPress={() => {
            store.claimDaily();
            hapticSuccess();
            onClose();
          }}
        />
      ) : (
        <Text style={{ color: '#ffe08a', fontWeight: '800', textAlign: 'center' }}>Claimed today. See you tomorrow!</Text>
      )}
    </ModalCard>
  );
}

function isYesterday(dateStr: string): boolean {
  if (!dateStr) return false;
  const d = new Date(Date.now() - 24 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return dateStr === `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function streakAfter(store: ReturnType<typeof useStore>): number {
  return isYesterday(store.data.dailyDate) ? store.data.dailyStreak + 1 : 1;
}

export function AchievementsModal({ onClose }: { onClose: () => void }) {
  const store = useStore();
  const theme = themeById(store.data.theme);
  return (
    <ModalCard theme={theme} title="Achievements" onClose={onClose} width={340}>
      <View style={{ width: '100%', gap: 8 }}>
        {store.achievements.map((a) => (
          <View
            key={a.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 10,
              borderRadius: 14,
              backgroundColor: a.done ? 'rgba(255,196,58,0.16)' : 'rgba(255,255,255,0.06)',
              borderWidth: 1.5,
              borderColor: a.done ? GOLD : 'rgba(255,255,255,0.1)',
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: a.done ? GOLD : 'rgba(255,255,255,0.1)' }}>
              <Icon name={a.done ? 'trophy' : 'lock'} size={22} color={a.done ? '#5a2e05' : '#9fb0d0'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{a.title}</Text>
              <Text style={{ color: '#9fb0d0', fontSize: 12 }}>{a.desc}</Text>
            </View>
            <Text style={{ color: a.done ? GOLD : '#9fb0d0', fontWeight: '800' }}>{a.progress}</Text>
          </View>
        ))}
      </View>
      <GameButton label="CLOSE" width={160} height={46} fontSize={18} colors={['#c8d4ee', '#97a9d0']} edge="#6a7ba3" textColor="#142447" onPress={onClose} />
    </ModalCard>
  );
}
