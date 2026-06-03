import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

/**
 * WaveformVisualizer 元件屬性介面
 */
interface WaveformVisualizerProps {
  /** 是否正在進行錄音/採集 */
  isRecording: boolean;
}

/**
 * 腸音動態波形模擬元件
 * 在採集時利用多重不同相位與頻率的正弦波動態相加干涉，模擬高質感的腸音信號起伏。
 * 當停止錄音時，波形會以平滑動畫回歸至水平直線（靜止狀態）。
 */
export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ isRecording }) => {
  const BAR_COUNT = 36; // 顯示的波形柱狀條數量
  const [heights, setHeights] = useState<number[]>(Array(BAR_COUNT).fill(4));
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const heightsRef = useRef<number[]>(heights);

  // 同步 heights 至 ref，以利在不將其放入 useEffect 依賴項的情況下獲取最新資料
  heightsRef.current = heights;

  useEffect(() => {
    if (isRecording) {
      // 正在採集時的動畫循環
      const updateWave = () => {
        phaseRef.current += 0.12; // 控制波形左右移動的速度
        const newHeights: number[] = [];

        for (let i = 0; i < BAR_COUNT; i++) {
          // 透過多個不同頻率、相位的正弦與餘弦波進行干涉合成
          const wave1 = Math.sin(i * 0.25 + phaseRef.current) * 30;
          const wave2 = Math.cos(i * 0.45 - phaseRef.current * 1.6) * 18;
          const wave3 = Math.sin(i * 0.12 - phaseRef.current * 0.8) * 12;

          // 加入隨機微小噪訊，讓波形更貼近真實生物電生理/聲學信號的隨機感
          const noise = (Math.random() - 0.5) * 6;

          // 模擬腸道活動的慢速包絡線 (envelope)，使波形呈現間歇性起伏（腸鳴音為陣發性而非恆定正弦波）
          const envelope = Math.sin(phaseRef.current * 0.2) * 0.4 + 0.6;

          // 計算綜合振幅後套用包絡線
          let amplitude = (wave1 + wave2 + wave3 + noise) * envelope;

          // 取絕對值並加上基礎高度，限制在安全顯示高度範圍內 (4 ~ 110 px)
          let barHeight = Math.max(4, Math.abs(amplitude) + 6);
          barHeight = Math.min(110, barHeight);

          newHeights.push(barHeight);
        }

        setHeights(newHeights);
        animationRef.current = requestAnimationFrame(updateWave);
      };

      animationRef.current = requestAnimationFrame(updateWave);
    } else {
      // 停止採集後，平滑收縮回水平靜止狀態 (高度 4 px)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }

      let currentHeights = [...heightsRef.current];
      const shrinkWave = () => {
        let isDone = true;
        const nextHeights = currentHeights.map(h => {
          if (h > 4) {
            isDone = false;
            // 每幀遞減高度，直到回到靜止水平線的 4 px
            return Math.max(4, h - 6);
          }
          return 4;
        });

        setHeights(nextHeights);
        currentHeights = nextHeights;

        if (!isDone) {
          animationRef.current = requestAnimationFrame(shrinkWave);
        }
      };

      animationRef.current = requestAnimationFrame(shrinkWave);
    }

    // 卸載時清除動畫框架
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

  return (
    <View style={visualizerStyles.container}>
      {heights.map((height, index) => (
        <View
          key={index}
          style={[
            visualizerStyles.bar,
            {
              height: height,
              backgroundColor: isRecording ? '#0D6EFD' : '#94A3B8', // 錄音中為科技藍，靜止為灰
              opacity: isRecording ? 0.9 : 0.4,
            },
          ]}
        />
      ))}
    </View>
  );
};

const visualizerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    width: '100%',
    paddingHorizontal: 10,
  },
  bar: {
    width: 4,
    marginHorizontal: 2,
    borderRadius: 2,
  },
});
