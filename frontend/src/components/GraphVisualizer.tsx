import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Canvas } from 'react-native-canvas';
import { GraphNode, GraphEdge, GraphData } from '../services/graph';

const { width: screenWidth } = Dimensions.get('window');

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  node: GraphNode;
}

export interface GraphVisualizerProps {
  data: GraphData;
  onNodePress?: (node: GraphNode) => void;
  animationEnabled?: boolean;
}

/**
 * Force-directed layout algorithm for positioning nodes
 * Uses Coulomb repulsion and spring attraction
 */
class ForceDirectedLayout {
  private nodes: LayoutNode[] = [];
  private edges: GraphEdge[] = [];
  private canvasWidth: number;
  private canvasHeight: number;
  private iterations = 100;
  private repulsionStrength = 5000;
  private attractionStrength = 0.1;
  private friction = 0.85;

  constructor(graphData: GraphData, width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.edges = graphData.edges;

    // Initialize nodes with random positions
    graphData.nodes.forEach((node, index) => {
      const angle = (index / graphData.nodes.length) * Math.PI * 2;
      const radius = 100 + node.depth * 50;
      this.nodes.push({
        id: node.id,
        x: this.canvasWidth / 2 + radius * Math.cos(angle),
        y: this.canvasHeight / 2 + radius * Math.sin(angle),
        node,
      });
    });
  }

  compute(): LayoutNode[] {
    for (let iter = 0; iter < this.iterations; iter++) {
      // Reset forces
      const forces = new Map<string, { x: number; y: number }>();
      this.nodes.forEach(n => forces.set(n.id, { x: 0, y: 0 }));

      // Repulsive forces (Coulomb)
      for (let i = 0; i < this.nodes.length; i++) {
        for (let j = i + 1; j < this.nodes.length; j++) {
          const n1 = this.nodes[i];
          const n2 = this.nodes[j];

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distance = Math.sqrt(dx * dx + dy * dy) + 0.1;

          const force = this.repulsionStrength / (distance * distance);
          const fx = (force * dx) / distance;
          const fy = (force * dy) / distance;

          forces.get(n1.id)!.x -= fx;
          forces.get(n1.id)!.y -= fy;
          forces.get(n2.id)!.x += fx;
          forces.get(n2.id)!.y += fy;
        }
      }

      // Attractive forces (Hooke's law)
      for (const edge of this.edges) {
        const n1 = this.nodes.find(n => n.id === edge.source);
        const n2 = this.nodes.find(n => n.id === edge.target);

        if (n1 && n2) {
          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const distance = Math.sqrt(dx * dx + dy * dy) + 0.1;
          const targetDistance = 150;

          const force = this.attractionStrength * (distance - targetDistance);
          const fx = (force * dx) / distance;
          const fy = (force * dy) / distance;

          forces.get(n1.id)!.x += fx;
          forces.get(n1.id)!.y += fy;
          forces.get(n2.id)!.x -= fx;
          forces.get(n2.id)!.y -= fy;
        }
      }

      // Apply forces and friction
      for (const node of this.nodes) {
        const f = forces.get(node.id)!;
        node.x += f.x * this.friction;
        node.y += f.y * this.friction;

        // Keep nodes within bounds with padding
        const padding = 40;
        node.x = Math.max(padding, Math.min(this.canvasWidth - padding, node.x));
        node.y = Math.max(padding, Math.min(this.canvasHeight - padding, node.y));
      }
    }

    return this.nodes;
  }
}

export const GraphVisualizer = ({
  data,
  onNodePress,
  animationEnabled = true,
}: GraphVisualizerProps) => {
  const canvasRef = useRef<any>(null);
  const [layout, setLayout] = useState<LayoutNode[]>([]);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const canvasWidth = screenWidth - 20;
  const canvasHeight = 500;

  useEffect(() => {
    // Compute layout
    const layoutAlgo = new ForceDirectedLayout(data, canvasWidth, canvasHeight);
    const layoutResult = layoutAlgo.compute();
    setLayout(layoutResult);

    // Draw after layout is computed
    setTimeout(() => {
      drawGraph(layoutResult);
    }, 100);
  }, [data]);

  const drawGraph = (layoutNodes: LayoutNode[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw edges
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1.5;
    for (const edge of data.edges) {
      const from = layoutNodes.find(n => n.id === edge.source);
      const to = layoutNodes.find(n => n.id === edge.target);

      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const layoutNode of layoutNodes) {
      const isHighlighted = highlightedNodeId === layoutNode.id;
      const isCurrentUser = layoutNode.node.isCurrentUser;

      // Node circle
      const radius = isCurrentUser ? 18 : 12 + layoutNode.node.depth * 1.5;
      ctx.fillStyle = isCurrentUser
        ? '#C35129'
        : getColorByDepth(layoutNode.node.depth, isHighlighted);
      ctx.beginPath();
      ctx.arc(layoutNode.x, layoutNode.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Border for current user
      if (isCurrentUser) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(layoutNode.x, layoutNode.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Highlight border
      if (isHighlighted) {
        ctx.strokeStyle = '#FFB800';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(layoutNode.x, layoutNode.y, radius + 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const getColorByDepth = (depth: number, highlighted: boolean): string => {
    if (highlighted) return '#FFD700';

    const colors: { [key: number]: string } = {
      0: '#C35129',
      1: '#4ECDC4',
      2: '#45B7D1',
      3: '#96CEB4',
      4: '#FFEAA7',
    };

    return colors[depth] || '#CCCCCC';
  };

  const handleCanvasPress = (event: any) => {
    if (!layout.length) return;

    const { locationX, locationY } = event.nativeEvent;
    const threshold = 25;

    for (const layoutNode of layout) {
      const distance = Math.sqrt(
        Math.pow(layoutNode.x - locationX, 2) +
        Math.pow(layoutNode.y - locationY, 2)
      );

      if (distance < threshold) {
        setHighlightedNodeId(layoutNode.id);
        onNodePress?.(layoutNode.node);
        return;
      }
    }
  };

  if (!layout.length) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#C35129" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={styles.canvas}
        onTouchEnd={handleCanvasPress}
      />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#C35129' }]} />
          <Text style={styles.legendLabel}>You</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#4ECDC4' }]} />
          <Text style={styles.legendLabel}>Direct Friends</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#45B7D1' }]} />
          <Text style={styles.legendLabel}>2nd Degree</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#96CEB4' }]} />
          <Text style={styles.legendLabel}>3rd Degree</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  canvas: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Afacad-Regular',
  },
});
