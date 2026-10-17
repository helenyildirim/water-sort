import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Coin, Icon } from '../art/Icons';
import { HINT_COST } from '../config';
import { LEVELS } from '../game/levelData';
import { Tubes, applyPour, decodeTube, isSolved, isTubeDone, pourAmount } from '../game/logic';
import { solve } from '../game/solver';
import { themeById } from '../game/themes';
import { useStore } from '../state/store';
import { hapticError, hapticLight, hapticSelect, hapticSuccess } from '../util/haptics';
import { Board, PourOrder } from './Board';
import { CoinPill, GameButton, ModalCard, RoundButton, Stars } from './kit';

export function starsFor(moves: number, par: number): number {
  if (moves <= Math.ceil(par * 1.35) + 1) return 3;
  if (moves <= Math.ceil(par * 1.9) + 2) return 2;
  return 1;
}

type Props = {
  level: number;
  onHome: () => void;
  onNext: () => void;
};

export function GameScreen({ level, onHome, onNext }: Props) {
  const store = useStore();
  const theme = themeById(store.data.theme);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const def = LEVELS[level - 1];

  const initial = useMemo<Tubes>(() => def.tubes.map(decodeTube), [def]);
  const [tubes, setTubes] = useState<Tubes>(initial);
  const [history, setHistory] = useState<Tubes[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [pour, setPour] = useState<PourOrder | null>(null);
  const [moves, setMoves] = useState(0);
  const [extraUsed, setExtraUsed] = useState(false);
  const [hint, setHint] = useState<[number, number] | null>(null);
  const [paused, setPaused] = useState(false);
  const [win, setWin] = useState<{ stars: number; reward: number; first: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const pourId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = useRef(false);

  const busy = pour !== null;

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (win) {
        onHome();
      } else {
        setPaused((p) => !p);
      }
      return true;
    });
    return () => sub.remove();
  }, [win, onHome]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1800);
  };

  const onTap = (i: number) => {
    if (busy || win || paused) return;
    setHint(null);
    const t = tubes[i];
    if (selected === null) {
      if (t.length > 0 && !isTubeDone(t)) {
        setSelected(i);
        hapticSelect();
      } else {
        hapticError();
      }
      return;
    }
    if (selected === i) {
      setSelected(null);
      hapticSelect();
      return;
    }
    const count = pourAmount(tubes, selected, i);
    if (count > 0) {
      const src = tubes[selected];
      pourId.current += 1;
      setPour({ id: pourId.current, from: selected, to: i, count, color: src[src.length - 1] });
      setSelected(null);
      hapticLight();
    } else if (t.length > 0 && !isTubeDone(t)) {
      setSelected(i); // switch the selection
      hapticSelect();
    } else {
      setSelected(null);
      hapticError();
    }
  };

  const onPourDone = (id: number) => {
    if (!pour || pour.id !== id) return;
    const res = applyPour(tubes, pour.from, pour.to);
    setPour(null);
    if (!res) return;
    setHistory((h) => [...h, tubes]);
    setTubes(res.tubes);
    const m = moves + 1;
    setMoves(m);
    if (isSolved(res.tubes) && !finished.current) {
      finished.current = true;
      const stars = starsFor(m, def.par);
      setTimeout(() => {
        const r = store.completeLevel(level, stars);
        hapticSuccess();
        setWin({ stars, reward: r.reward, first: r.first });
      }, 750);
    }
  };

  const undo = () => {
    if (busy || win || history.length === 0) return;
    const prev = history[history.length - 1];
    const next = prev.map((t) => t.slice());
    while (next.length < tubes.length) next.push([]);
    setTubes(next);
    setHistory(history.slice(0, -1));
    setMoves((m) => Math.max(0, m - 1));
    setSelected(null);
    setHint(null);
    hapticSelect();
  };

  const restart = () => {
    if (busy) return;
    setTubes(initial.map((t) => t.slice()));
    setHistory([]);
    setMoves(0);
    setSelected(null);
    setHint(null);
    setExtraUsed(false);
    setPaused(false);
    finished.current = false;
  };

  const addTube = () => {
    if (busy || win || extraUsed) return;
    setTubes([...tubes, []]);
    setExtraUsed(true);
    setSelected(null);
    hapticLight();
  };

  const giveHint = () => {
    if (busy || win) return;
    if (store.data.coins < HINT_COST) {
      hapticError();
      showToast('Not enough coins for a hint');
      return;
    }
    const sol = solve(tubes, 80000);
    if (!sol || sol.length === 0) {
      showToast('No way forward from here. Try undo or add a tube.');
      return;
    }
    if (!store.spendCoins(HINT_COST)) return;
    setSelected(null);
    setHint(sol[0]);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), 2400);
  };

  // ---- layout ---------------------------------------------------------------
  const topBar = 64;
  const bottomBar = 112;
  const boardH = height - insets.top - insets.bottom - topBar - bottomBar;
  const live = starsFor(moves, def.par);

  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <View style={{ height: topBar, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        <RoundButton icon="pause" size={44} theme={theme} onPress={() => setPaused(true)} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '900' }}>Level {level}</Text>
          <Stars count={live} size={18} />
        </View>
        <CoinPill coins={store.data.coins} theme={theme} />
      </View>

      <View style={{ flex: 1, alignItems: 'center' }}>
        <Board
          tubes={tubes}
          selected={selected}
          hint={hint}
          width={width}
          height={boardH}
          theme={theme}
          pour={pour}
          onTap={onTap}
          onPourDone={onPourDone}
        />
      </View>

      <View style={{ height: bottomBar, flexDirection: 'row', justifyContent: 'center', gap: 22, paddingTop: 10 }}>
        <RoundButton icon="undo" label="Undo" theme={theme} onPress={undo} disabled={history.length === 0} />
        <RoundButton icon="restart" label="Restart" theme={theme} onPress={restart} />
        <RoundButton icon="addTube" label={extraUsed ? 'Used' : 'Add tube'} theme={theme} onPress={addTube} disabled={extraUsed} />
        <RoundButton icon="bulb" label="Hint" badge={String(HINT_COST)} theme={theme} onPress={giveHint} disabled={store.data.coins < HINT_COST} />
      </View>

      {toast ? (
        <View style={{ position: 'absolute', left: 24, right: 24, bottom: insets.bottom + bottomBar + 6, alignItems: 'center' }} pointerEvents="none">
          <View style={{ backgroundColor: 'rgba(5,12,32,0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16 }}>
            <Text style={{ color: '#fff', fontWeight: '700', textAlign: 'center' }}>{toast}</Text>
          </View>
        </View>
      ) : null}

      {paused && !win ? (
        <ModalCard theme={theme} title="Paused" onClose={() => setPaused(false)}>
          <GameButton label="RESUME" width={230} onPress={() => setPaused(false)} icon="play" />
          <GameButton
            label="RESTART"
            width={230}
            height={52}
            fontSize={20}
            colors={['#5cc8ff', '#2a8cff']}
            edge="#1560c4"
            textColor="#04204d"
            onPress={restart}
          />
          <GameButton
            label="HOME"
            width={230}
            height={52}
            fontSize={20}
            colors={['#c8d4ee', '#97a9d0']}
            edge="#6a7ba3"
            textColor="#142447"
            onPress={onHome}
          />
        </ModalCard>
      ) : null}

      {win ? <WinCard stars={win.stars} reward={win.reward} first={win.first} hasNext={level < LEVELS.length} onNext={onNext} onHome={onHome} onReplay={() => {
            setWin(null);
            restart();
          }} /> : null}
    </View>
  );

}

function WinCard({
  stars,
  reward,
  first,
  hasNext,
  onNext,
  onHome,
  onReplay,
}: {
  stars: number;
  reward: number;
  first: boolean;
  hasNext: boolean;
  onNext: () => void;
  onHome: () => void;
  onReplay: () => void;
}) {
  const store = useStore();
  const theme = themeById(store.data.theme);
  const pops = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    Animated.stagger(
      200,
      pops.slice(0, stars).map((v) => Animated.spring(v, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true })),
    ).start();
  }, [pops, stars]);
  return (
    <ModalCard theme={theme} title="Level Complete!" width={330}>
      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 6 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 62, height: 62, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', opacity: 0.25 }}>
              <Icon name="star" size={58} color="#9fb0d0" />
            </View>
            {i < stars ? (
              <Animated.View style={{ transform: [{ scale: pops[i].interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }, { rotate: i === 1 ? '0deg' : i === 0 ? '-10deg' : '10deg' }] }}>
                <Icon name="star" size={62} color="#ffc43a" />
              </Animated.View>
            ) : null}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Coin size={30} />
        <Text style={{ color: '#ffe08a', fontSize: 26, fontWeight: '900' }}>+{reward}</Text>
      </View>
      <Text style={{ color: '#9fb0d0', fontSize: 13 }}>{first ? 'First clear bonus' : 'Replay reward'}</Text>
      {hasNext ? <GameButton label="NEXT" width={230} onPress={onNext} /> : <Text style={{ color: '#fff', fontWeight: '800' }}>You finished every level!</Text>}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <GameButton label="REPLAY" width={110} height={46} fontSize={16} colors={['#5cc8ff', '#2a8cff']} edge="#1560c4" textColor="#04204d" onPress={onReplay} />
        <GameButton label="HOME" width={110} height={46} fontSize={16} colors={['#c8d4ee', '#97a9d0']} edge="#6a7ba3" textColor="#142447" onPress={onHome} />
      </View>
    </ModalCard>
  );
}
