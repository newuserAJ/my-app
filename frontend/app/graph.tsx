import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { graphService, GraphData, GraphNode } from '../src/services/graph';
import { SimpleGraphVisualizer } from '../src/components/SimpleGraphVisualizer';
import { GraphStatsPanel } from '../src/components/GraphStats';

const { width: screenWidth } = Dimensions.get('window');

export default function GraphScreen() {
  const router = useRouter();
  const { user, sessionToken } = useAuth();
  
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'graph' | 'stats'>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [depth, setDepth] = useState(3);
  
  // Animation for the selected node panel
  const slideUpAnim = React.useRef(new Animated.Value(500)).current;

  useEffect(() => {
    loadGraphData();
  }, [depth]);

  const loadGraphData = async () => {
    try {
      setLoading(true);
      if (!sessionToken) {
        throw new Error('No session token available');
      }

      const data = await graphService.getNetworkGraph(depth, sessionToken);
      setGraphData(data);
      setSelectedNode(null);
    } catch (error) {
      console.error('Error loading graph:', error);
      Alert.alert(
        'Error',
        'Failed to load graph. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNodePress = (node: GraphNode) => {
    setSelectedNode(node);
    Animated.timing(slideUpAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start();
  };

  const closeNodePanel = () => {
    Animated.timing(slideUpAnim, {
      toValue: 500,
      duration: 300,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
      useNativeDriver: true,
    }).start(() => setSelectedNode(null));
  };

  const getDepthLabel = (depth: number): string => {
    const labels: { [key: number]: string } = {
      0: 'You',
      1: 'Direct Friend',
      2: 'Friend of Friend',
      3: 'Extended Network',
      4: 'Distant Connection',
    };
    return labels[depth] || 'Unknown';
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Please log in to view your network graph</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Network Graph</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 28 }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'graph' && styles.tabActive]}
          onPress={() => setActiveTab('graph')}
        >
          <Ionicons
            name="git-network"
            size={18}
            color={activeTab === 'graph' ? '#C35129' : '#999999'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'graph' && styles.tabLabelActive,
            ]}
          >
            Graph
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
          onPress={() => setActiveTab('stats')}
        >
          <Ionicons
            name="stats-chart"
            size={18}
            color={activeTab === 'stats' ? '#C35129' : '#999999'}
          />
          <Text
            style={[
              styles.tabLabel,
              activeTab === 'stats' && styles.tabLabelActive,
            ]}
          >
            Statistics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#C35129" />
          <Text style={styles.loadingText}>Loading your network...</Text>
        </View>
      ) : graphData ? (
        <>
          {/* Graph Tab Content */}
          {activeTab === 'graph' && (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Depth Selector */}
              <View style={styles.depthSelectorContainer}>
                <Text style={styles.depthSelectorLabel}>Network Depth:</Text>
                <View style={styles.depthButtonGroup}>
                  {[1, 2, 3, 4].map(d => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.depthButton,
                        depth === d && styles.depthButtonActive,
                      ]}
                      onPress={() => setDepth(d)}
                    >
                      <Text
                        style={[
                          styles.depthButtonText,
                          depth === d && styles.depthButtonTextActive,
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Graph Visualizer */}
              <View style={styles.graphContainer}>
              <SimpleGraphVisualizer
                data={graphData}
                onNodePress={handleNodePress}
                animationEnabled={true}
              />
              </View>

              {/* Info Cards */}
              <View style={styles.infoCards}>
                <View style={styles.infoCard}>
                  <View style={styles.infoCardIcon}>
                    <Ionicons name="people" size={24} color="#4ECDC4" />
                  </View>
                  <View style={styles.infoCardContent}>
                    <Text style={styles.infoCardValue}>
                      {graphData.stats.totalNodes}
                    </Text>
                    <Text style={styles.infoCardLabel}>People in Network</Text>
                  </View>
                </View>

                <View style={styles.infoCard}>
                  <View style={styles.infoCardIcon}>
                    <Ionicons name="git-branch" size={24} color="#45B7D1" />
                  </View>
                  <View style={styles.infoCardContent}>
                    <Text style={styles.infoCardValue}>
                      {graphData.stats.totalEdges}
                    </Text>
                    <Text style={styles.infoCardLabel}>Connections</Text>
                  </View>
                </View>
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>
          )}

          {/* Statistics Tab Content */}
          {activeTab === 'stats' && (
            <GraphStatsPanel stats={graphData.stats} />
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF6B6B" />
          <Text style={styles.errorText}>Failed to load graph data</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadGraphData}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Selected Node Panel */}
      {selectedNode && (
        <Animated.View
          style={[
            styles.nodePanel,
            { transform: [{ translateY: slideUpAnim }] },
          ]}
        >
          <View style={styles.nodePanelHandle} />

          <View style={styles.nodePanelHeader}>
            <View style={styles.nodePanelClose}>
              <TouchableOpacity onPress={closeNodePanel}>
                <Ionicons name="close" size={24} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.nodePanelContent}>
            {/* Node Avatar Placeholder */}
            <View style={styles.nodeAvatar}>
              <Ionicons name="person-circle" size={80} color="#C35129" />
            </View>

            {/* Node Info */}
            <Text style={styles.nodeName}>{selectedNode.label}</Text>
            <View style={styles.nodeBadge}>
              <Text style={styles.nodeBadgeText}>
                {getDepthLabel(selectedNode.depth)}
              </Text>
            </View>

            {/* Node Stats */}
            <View style={styles.nodeStats}>
              <View style={styles.nodeStat}>
                <Text style={styles.nodeStatLabel}>Network Depth</Text>
                <Text style={styles.nodeStatValue}>{selectedNode.depth}</Text>
              </View>
              <View style={styles.nodeStat}>
                <Text style={styles.nodeStatLabel}>Status</Text>
                <Text style={styles.nodeStatValue}>
                  {selectedNode.isCurrentUser ? 'You' : 'Connected'}
                </Text>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </Animated.View>
      )}

      {/* Overlay for node panel */}
      {selectedNode && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={closeNodePanel}
          activeOpacity={1}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Afacad-Bold',
    color: '#000000',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#C35129',
    backgroundColor: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: 'Afacad-SemiBold',
    color: '#999999',
  },
  tabLabelActive: {
    color: '#C35129',
  },
  content: {
    flex: 1,
    paddingVertical: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
    fontFamily: 'Afacad-Regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontFamily: 'Afacad-SemiBold',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#C35129',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Afacad-SemiBold',
  },
  depthSelectorContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  depthSelectorLabel: {
    fontSize: 14,
    fontFamily: 'Afacad-SemiBold',
    color: '#000000',
    marginBottom: 8,
  },
  depthButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  depthButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  depthButtonActive: {
    backgroundColor: '#C35129',
  },
  depthButtonText: {
    fontSize: 14,
    fontFamily: 'Afacad-SemiBold',
    color: '#666666',
  },
  depthButtonTextActive: {
    color: '#FFFFFF',
  },
  graphContainer: {
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  infoCards: {
    paddingHorizontal: 16,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  infoCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCardContent: {
    flex: 1,
  },
  infoCardValue: {
    fontSize: 18,
    fontFamily: 'Afacad-Bold',
    color: '#000000',
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Afacad-Regular',
  },
  nodePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  nodePanelHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDDDDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  nodePanelHeader: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  nodePanelClose: {
    alignItems: 'flex-end',
  },
  nodePanelContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  nodeAvatar: {
    alignItems: 'center',
    marginBottom: 16,
  },
  nodeName: {
    fontSize: 22,
    fontFamily: 'Afacad-Bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  nodeBadge: {
    backgroundColor: '#E8F4F8',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 16,
  },
  nodeBadgeText: {
    fontSize: 12,
    fontFamily: 'Afacad-SemiBold',
    color: '#45B7D1',
  },
  nodeStats: {
    flexDirection: 'row',
    gap: 16,
  },
  nodeStat: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  nodeStatLabel: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Afacad-Regular',
    marginBottom: 8,
  },
  nodeStatValue: {
    fontSize: 18,
    fontFamily: 'Afacad-Bold',
    color: '#C35129',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
