import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { GraphNode, GraphEdge, GraphData } from '../services/graph';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  animatedX: Animated.Value;
  animatedY: Animated.Value;
}

interface SimpleGraphVisualizerProps {
  data: GraphData;
  onNodePress?: (node: GraphNode) => void;
  animationEnabled?: boolean;
}

/**
 * Simple graph visualizer using React Native Views instead of Canvas
 * More reliable and easier to maintain than canvas-based solution
 */
export function SimpleGraphVisualizer({ 
  data, 
  onNodePress, 
  animationEnabled = true 
}: SimpleGraphVisualizerProps) {
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 350, height: 400 });

  useEffect(() => {
    calculateLayout();
  }, [data, containerSize]);

  const calculateLayout = () => {
    const { width, height } = containerSize;
    const centerX = width / 2;
    const centerY = height / 2;
    const nodes: LayoutNode[] = [];

    data.nodes.forEach((node, index) => {
      let x = centerX;
      let y = centerY;

      if (node.depth === 0) {
        // Center node (current user)
        x = centerX;
        y = centerY;
      } else {
        // Calculate positions in concentric circles
        const radius = node.depth * 80; // Distance from center
        const nodesAtDepth = data.nodes.filter(n => n.depth === node.depth);
        const nodeIndexAtDepth = nodesAtDepth.findIndex(n => n.id === node.id);
        const angleStep = (2 * Math.PI) / nodesAtDepth.length;
        const angle = nodeIndexAtDepth * angleStep;
        
        x = centerX + radius * Math.cos(angle);
        y = centerY + radius * Math.sin(angle);
      }

      // Keep nodes within bounds
      x = Math.max(20, Math.min(width - 20, x));
      y = Math.max(20, Math.min(height - 20, y));

      nodes.push({
        ...node,
        x,
        y,
        animatedX: new Animated.Value(animationEnabled ? centerX : x),
        animatedY: new Animated.Value(animationEnabled ? centerY : y),
      });
    });

    setLayoutNodes(nodes);

    // Animate nodes to their positions
    if (animationEnabled) {
      const animations = nodes.map(node => 
        Animated.parallel([
          Animated.spring(node.animatedX, {
            toValue: node.x,
            friction: 8,
            tension: 100,
            useNativeDriver: false,
          }),
          Animated.spring(node.animatedY, {
            toValue: node.y,
            friction: 8,
            tension: 100,
            useNativeDriver: false,
          }),
        ])
      );

      Animated.stagger(50, animations).start();
    }
  };

  const getNodeColor = (depth: number): string => {
    const colors = {
      0: '#FF6B6B', // Red - You
      1: '#4ECDC4', // Teal - Direct friends
      2: '#45B7D1', // Blue - Friends of friends
      3: '#96CEB4', // Green - Extended network
      4: '#FFEAA7', // Yellow - Distant connections
    };
    return colors[depth as keyof typeof colors] || '#DDD';
  };

  const renderEdges = () => {
    if (!layoutNodes.length) return null;

    return data.edges.map((edge, index) => {
      const sourceNode = layoutNodes.find(n => n.id === edge.source);
      const targetNode = layoutNodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return null;

      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      return (
        <View
          key={`edge-${index}`}
          style={[
            styles.edge,
            {
              left: sourceNode.x,
              top: sourceNode.y,
              width: length,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        />
      );
    });
  };

  const renderNodes = () => {
    return layoutNodes.map((node) => (
      <Animated.View
        key={node.id}
        style={[
          styles.nodeContainer,
          {
            left: animationEnabled ? node.animatedX : node.x,
            top: animationEnabled ? node.animatedY : node.y,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.node,
            { 
              backgroundColor: getNodeColor(node.depth),
              borderWidth: node.isCurrentUser ? 3 : 1,
              borderColor: node.isCurrentUser ? '#333' : '#FFF',
            },
          ]}
          onPress={() => onNodePress?.(node)}
          activeOpacity={0.8}
        >
          <Text 
            style={[
              styles.nodeText,
              { fontSize: node.isCurrentUser ? 12 : 10 }
            ]}
            numberOfLines={1}
          >
            {node.label.length > 8 ? node.label.substring(0, 8) : node.label}
          </Text>
        </TouchableOpacity>
        
        {/* Depth indicator */}
        {!node.isCurrentUser && (
          <View style={styles.depthIndicator}>
            <Text style={styles.depthText}>{node.depth}</Text>
          </View>
        )}
      </Animated.View>
    ));
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      minimumZoomScale={0.5}
      maximumZoomScale={2.0}
      bouncesZoom={true}
    >
      <View
        style={[styles.graphContainer, containerSize]}
        onLayout={(event) => {
          const { width, height } = event.nativeEvent.layout;
          setContainerSize({ width, height });
        }}
      >
        {/* Render edges first (behind nodes) */}
        {renderEdges()}
        
        {/* Render nodes on top */}
        {renderNodes()}
        
        {/* Instructions overlay */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Tap nodes for details • Pinch to zoom
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  graphContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  edge: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    transformOrigin: '0 50%',
    zIndex: 1,
  },
  nodeContainer: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
  },
  node: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  nodeText: {
    color: '#FFF',
    fontFamily: 'Afacad-Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  depthIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  depthText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: 'Afacad-Bold',
  },
  instructions: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  instructionsText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: 'Afacad-Regular',
  },
});