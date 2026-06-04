import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GraphData, GraphNode } from '../services/graph';
import { theme } from '../theme';

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  animatedX: Animated.Value;
  animatedY: Animated.Value;
  scale: Animated.Value;
}

interface SimpleGraphVisualizerProps {
  data: GraphData;
  onNodePress?: (node: GraphNode) => void;
  animationEnabled?: boolean;
}

const NODE_SIZE = 72;

export function SimpleGraphVisualizer({
  data,
  onNodePress,
  animationEnabled = true,
}: SimpleGraphVisualizerProps) {
  const { width: windowWidth } = useWindowDimensions();
  const graphHeight = windowWidth >= 820 ? 560 : 440;
  const [containerSize, setContainerSize] = useState({ width: 600, height: graphHeight });
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const { width, height } = containerSize;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(90, Math.min(width, height) / 2 - 70);

    const nodes = data.nodes.map((node) => {
      let x = centerX;
      let y = centerY;

      if (node.depth > 0) {
        const peers = data.nodes.filter((item) => item.depth === node.depth);
        const index = peers.findIndex((item) => item.id === node.id);
        const angle = (index / Math.max(peers.length, 1)) * Math.PI * 2 - Math.PI / 2;
        const radius = Math.min(maxRadius, 95 + (node.depth - 1) * 82);
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle);
      }

      return {
        ...node,
        x,
        y,
        animatedX: new Animated.Value(animationEnabled ? centerX : x),
        animatedY: new Animated.Value(animationEnabled ? centerY : y),
        scale: new Animated.Value(animationEnabled ? 0.2 : 1),
      };
    });

    setLayoutNodes(nodes);

    if (animationEnabled) {
      Animated.stagger(
        70,
        nodes.map((node) =>
          Animated.parallel([
            Animated.spring(node.animatedX, {
              toValue: node.x,
              friction: 8,
              tension: 70,
              useNativeDriver: false,
            }),
            Animated.spring(node.animatedY, {
              toValue: node.y,
              friction: 8,
              tension: 70,
              useNativeDriver: false,
            }),
            Animated.spring(node.scale, {
              toValue: 1,
              friction: 6,
              tension: 90,
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    }
  }, [animationEnabled, containerSize, data]);

  const edges = useMemo(() => {
    return data.edges
      .map((edge) => {
        const source = layoutNodes.find((node) => node.id === edge.source);
        const target = layoutNodes.find((node) => node.id === edge.target);
        if (!source || !target) return null;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        return {
          id: `${edge.source}-${edge.target}`,
          left: source.x,
          top: source.y,
          width: Math.sqrt(dx * dx + dy * dy),
          angle: Math.atan2(dy, dx) * (180 / Math.PI),
        };
      })
      .filter(Boolean);
  }, [data.edges, layoutNodes]);

  const animateNode = (node: LayoutNode, pressed: boolean) => {
    Animated.spring(node.scale, {
      toValue: pressed ? 0.9 : 1,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View
      style={[styles.canvas, { height: graphHeight }]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width > 0 && (width !== containerSize.width || height !== containerSize.height)) {
          setContainerSize({ width, height });
        }
      }}
    >
      <View style={[styles.ring, styles.ringOne]} />
      <View style={[styles.ring, styles.ringTwo]} />
      <View style={[styles.ring, styles.ringThree]} />

      {edges.map((edge) =>
        edge ? (
          <View
            key={edge.id}
            style={[
              styles.edge,
              {
                left: edge.left,
                top: edge.top,
                width: edge.width,
                transform: [{ rotate: `${edge.angle}deg` }],
              },
            ]}
          />
        ) : null
      )}

      {layoutNodes.map((node) => {
        const nodeSize = node.isCurrentUser ? 82 : NODE_SIZE;
        return (
          <Animated.View
            key={node.id}
            style={[
              styles.nodeWrap,
              {
                width: nodeSize,
                height: nodeSize,
                left: Animated.subtract(node.animatedX, nodeSize / 2),
                top: Animated.subtract(node.animatedY, nodeSize / 2),
                transform: [{ scale: node.scale }],
              },
            ]}
          >
            {node.isCurrentUser && (
              <Animated.View
                style={[
                  styles.pulse,
                  {
                    transform: [
                      {
                        scale: pulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.35],
                        }),
                      },
                    ],
                    opacity: pulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.28, 0],
                    }),
                  },
                ]}
              />
            )}
            <Pressable
              style={[
                styles.node,
                node.isCurrentUser ? styles.currentNode : styles.connectionNode,
              ]}
              onPress={() => onNodePress?.(node)}
              onPressIn={() => animateNode(node, true)}
              onPressOut={() => animateNode(node, false)}
            >
              <Text style={styles.nodeText} numberOfLines={1}>
                {node.label || 'User'}
              </Text>
              <Text style={styles.nodeSubtext}>
                {node.isCurrentUser ? 'You' : `${node.depth} degree`}
              </Text>
            </Pressable>
          </Animated.View>
        );
      })}

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotYou]} />
          <Text style={styles.legendText}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, styles.legendDotConnection]} />
          <Text style={styles.legendText}>Connections</Text>
        </View>
        <View style={styles.legendHint}>
          <Ionicons name="hand-left-outline" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.legendText}>Tap a node</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    width: '100%',
    minHeight: 420,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#FFFCF9',
  },
  ring: {
    position: 'absolute',
    alignSelf: 'center',
    top: '50%',
    left: '50%',
    borderWidth: 1,
    borderColor: 'rgba(224, 91, 45, 0.11)',
  },
  ringOne: {
    width: 190,
    height: 190,
    marginLeft: -95,
    marginTop: -95,
    borderRadius: 95,
  },
  ringTwo: {
    width: 340,
    height: 340,
    marginLeft: -170,
    marginTop: -170,
    borderRadius: 170,
  },
  ringThree: {
    width: 500,
    height: 500,
    marginLeft: -250,
    marginTop: -250,
    borderRadius: 250,
  },
  edge: {
    position: 'absolute',
    height: 1.5,
    backgroundColor: 'rgba(15, 159, 154, 0.26)',
    transformOrigin: '0 50%',
  },
  nodeWrap: {
    position: 'absolute',
    zIndex: 5,
  },
  pulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    backgroundColor: theme.colors.primary,
  },
  node: {
    flex: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 2,
  },
  currentNode: {
    backgroundColor: theme.colors.primary,
    borderColor: '#FFFFFF',
  },
  connectionNode: {
    backgroundColor: theme.colors.accent,
    borderColor: '#FFFFFF',
  },
  nodeText: {
    fontFamily: theme.fonts.bold,
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    maxWidth: 62,
  },
  nodeSubtext: {
    marginTop: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 9,
    color: 'rgba(255,255,255,0.78)',
  },
  legend: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#F0E1D6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendHint: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendDotYou: {
    backgroundColor: theme.colors.primary,
  },
  legendDotConnection: {
    backgroundColor: theme.colors.accent,
  },
  legendText: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
});
