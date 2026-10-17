import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { BackHandler, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { themeById } from './src/game/themes';
import { StoreProvider, useStore } from './src/state/store';
import { Backdrop } from './src/ui/Backdrop';
import { GameScreen } from './src/ui/GameScreen';
import { HomeScreen, LevelsScreen, MoreScreen, Tab, TabBar, ThemesScreen } from './src/ui/HomeScreens';
import { AchievementsModal, DailyModal } from './src/ui/Modals';
import { Splash } from './src/ui/Splash';

function Root() {
  const store = useStore();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const theme = themeById(store.data.theme);
  const [tab, setTab] = useState<Tab>('home');
  const [playing, setPlaying] = useState<number | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [modal, setModal] = useState<'daily' | 'ach' | null>(null);
  const [splash, setSplash] = useState(true);

  const homeLevel = Math.min(picked ?? store.unlocked, store.unlocked);

  // Back button: close dialogs, return to the Home tab, then exit as usual.
  useEffect(() => {
    if (playing !== null) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (modal) {
        setModal(null);
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [playing, modal, tab]);

  if (!store.ready) return <View style={{ flex: 1, backgroundColor: '#0b2250' }} />;

  if (splash) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.stops[2] }}>
        <StatusBar style="light" />
        <Backdrop theme={theme} width={width} height={height} />
        <Splash onDone={() => setSplash(false)} />
      </View>
    );
  }

  const start = (n: number) => {
    setPlaying(n);
    setPicked(null);
    setModal(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.stops[2] }}>
      <StatusBar style="light" />
      <Backdrop theme={theme} width={width} height={height} />
      {playing !== null ? (
        <GameScreen
          key={playing}
          level={playing}
          onHome={() => {
            setPlaying(null);
            setTab('home');
          }}
          onNext={() => {
            if (playing < store.levelCount) setPlaying(playing + 1);
            else {
              setPlaying(null);
              setTab('home');
            }
          }}
        />
      ) : (
        <View style={{ flex: 1, paddingTop: insets.top }}>
          <View style={{ flex: 1 }}>
            {tab === 'home' && (
              <HomeScreen
                level={homeLevel}
                maxLevel={store.unlocked}
                onLevel={setPicked}
                onPlay={() => start(homeLevel)}
                onDaily={() => setModal('daily')}
                onAchievements={() => setModal('ach')}
              />
            )}
            {tab === 'levels' && <LevelsScreen onPlay={start} />}
            {tab === 'themes' && <ThemesScreen />}
            {tab === 'more' && <MoreScreen />}
          </View>
          <TabBar tab={tab} onTab={setTab} bottomInset={insets.bottom} />
          {modal === 'daily' && <DailyModal onClose={() => setModal(null)} />}
          {modal === 'ach' && <AchievementsModal onClose={() => setModal(null)} />}
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
