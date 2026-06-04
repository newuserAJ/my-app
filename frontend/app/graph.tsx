import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GraphStatsPanel } from '../src/components/GraphStats';
import { InteractiveCard } from '../src/components/InteractiveCard';
import { SimpleGraphVisualizer } from '../src/components/SimpleGraphVisualizer';
import { useAuth } from '../src/context/AuthContext';
import {
  GraphData,
  GraphNode,
  graphService,
  MutualUser,
  SuggestedUser,
} from '../src/services/graph';
import { theme } from '../src/theme';

type GraphTab = 'graph' | 'stats' | 'suggestions';

export default function GraphScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, sessionToken } = useAuth();
  const isDesktop = width >= 820;

  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GraphTab>('graph');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [depth, setDepth] = useState(3);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [mutualsLoadingFor, setMutualsLoadingFor] = useState<string | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestedUser | null>(null);
  const [selectedSuggestionMutuals, setSelectedSuggestionMutuals] = useState<MutualUser[]>([]);

  const introOpacity = useRef(new Animated.Value(0)).current;
  const introY = useRef(new Animated.Value(20)).current;
  const tabOpacity = useRef(new Animated.Value(1)).current;
  const tabY = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(520)).current;

  const loadGraphData = useCallback(async () => {
    if (!sessionToken) return;
    try {
      setLoading(true);
      const data = await graphService.getNetworkGraph(depth, sessionToken);
      setGraphData(data);
      setSelectedNode(null);
    } catch (error) {
      console.error('Error loading graph:', error);
      Alert.alert('Network unavailable', 'We could not load your graph. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [depth, sessionToken]);

  const loadSuggestions = useCallback(async () => {
    if (!sessionToken) return;
    try {
      setSuggestionsLoading(true);
      setSuggestionsError(null);
      const response = await graphService.getSuggestions(sessionToken, 25);
      setSuggestions(response.suggestions || []);
      setSuggestionsLoaded(true);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      setSuggestionsError('Suggestions are unavailable right now.');
      setSuggestionsLoaded(true);
    } finally {
      setSuggestionsLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 480,
        useNativeDriver: true,
      }),
      Animated.spring(introY, {
        toValue: 0,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  }, [introOpacity, introY]);

  useEffect(() => {
    tabOpacity.setValue(0);
    tabY.setValue(14);
    Animated.parallel([
      Animated.timing(tabOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(tabY, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    if (activeTab === 'suggestions' && !suggestionsLoaded && !suggestionsLoading) {
      loadSuggestions();
    }
  }, [activeTab, loadSuggestions, suggestionsLoaded, suggestionsLoading, tabOpacity, tabY]);

  const openPanel = () => {
    panelY.setValue(520);
    Animated.spring(panelY, {
      toValue: 0,
      friction: 9,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handleNodePress = (node: GraphNode) => {
    setSelectedSuggestion(null);
    setSelectedSuggestionMutuals([]);
    setSelectedNode(node);
    openPanel();
  };

  const handleViewMutuals = async (suggestion: SuggestedUser) => {
    if (!sessionToken) return;
    try {
      setMutualsLoadingFor(suggestion.user.id);
      const response = await graphService.getMutuals(suggestion.user.id, sessionToken, 20);
      setSelectedNode(null);
      setSelectedSuggestion(suggestion);
      setSelectedSuggestionMutuals(response.mutuals || []);
      openPanel();
    } catch (error) {
      console.error('Error loading mutuals:', error);
      Alert.alert('Mutuals unavailable', 'We could not load mutual connections.');
    } finally {
      setMutualsLoadingFor(null);
    }
  };

  const closePanel = () => {
    Animated.timing(panelY, {
      toValue: 520,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSelectedNode(null);
      setSelectedSuggestion(null);
      setSelectedSuggestionMutuals([]);
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.centerState}>
          <Ionicons name="lock-closed-outline" size={30} color={theme.colors.primary} />
          <Text style={styles.stateTitle}>Sign in to view your network</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page}>
      <LinearGradient colors={theme.colors.pageGradient as any} style={StyleSheet.absoluteFillObject} />
      <View style={styles.orbOne} />
      <View style={styles.orbTwo} />

      <View style={styles.topBar}>
        <View style={styles.topBarInner}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.ink} />
          </TouchableOpacity>
          <View style={styles.topBarTitleWrap}>
            <Text style={styles.eyebrow}>HOTake</Text>
            <Text style={styles.topBarTitle}>Network</Text>
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/profile')}>
            <Ionicons name="person-outline" size={22} color={theme.colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: introOpacity, transform: [{ translateY: introY }] }}>
          <LinearGradient colors={theme.colors.heroGradient as any} style={styles.hero}>
            <View style={styles.heroGlow} />
            <View style={styles.heroCopy}>
              <View style={styles.heroBadge}>
                <Ionicons name="git-network-outline" size={14} color="#FFD5C5" />
                <Text style={styles.heroBadgeText}>Mutual network intelligence</Text>
              </View>
              <Text style={styles.heroTitle}>See how your world connects.</Text>
              <Text style={styles.heroSubtitle}>
                Explore relationship depth, discover warm introductions, and grow your network with context.
              </Text>
            </View>
            {graphData && (
              <View style={[styles.heroMetrics, !isDesktop && styles.heroMetricsMobile]}>
                <Metric label="People" value={String(graphData.stats.totalNodes)} />
                <Metric label="Connections" value={String(graphData.stats.totalEdges)} />
                <Metric label="Depth" value={String(graphData.stats.depthReached)} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        <View style={styles.tabs}>
          <TabButton
            active={activeTab === 'graph'}
            icon="git-network-outline"
            label="Graph"
            onPress={() => setActiveTab('graph')}
          />
          <TabButton
            active={activeTab === 'stats'}
            icon="stats-chart-outline"
            label="Insights"
            onPress={() => setActiveTab('stats')}
          />
          <TabButton
            active={activeTab === 'suggestions'}
            icon="sparkles-outline"
            label="Suggestions"
            onPress={() => setActiveTab('suggestions')}
          />
        </View>

        {loading ? (
          <LoadingState label="Mapping your network..." />
        ) : graphData ? (
          <Animated.View style={{ opacity: tabOpacity, transform: [{ translateY: tabY }] }}>
            {activeTab === 'graph' && (
              <>
                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={styles.sectionEyebrow}>EXPLORE</Text>
                    <Text style={styles.sectionTitle}>Connection graph</Text>
                  </View>
                  <View style={styles.depthControl}>
                    {[1, 2, 3, 4].map((item) => (
                      <Pressable
                        key={item}
                        style={[styles.depthButton, depth === item && styles.depthButtonActive]}
                        onPress={() => setDepth(item)}
                      >
                        <Text style={[styles.depthButtonText, depth === item && styles.depthButtonTextActive]}>
                          {item}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <InteractiveCard style={styles.graphCard}>
                  <SimpleGraphVisualizer data={graphData} onNodePress={handleNodePress} animationEnabled />
                </InteractiveCard>

                <View style={[styles.summaryGrid, !isDesktop && styles.stack]}>
                  <SummaryCard
                    icon="people-outline"
                    title={`${graphData.stats.totalNodes} people`}
                    subtitle="Visible in your current graph"
                    tone="teal"
                  />
                  <SummaryCard
                    icon="git-branch-outline"
                    title={`${graphData.stats.totalEdges} connections`}
                    subtitle="Relationships mapped so far"
                    tone="orange"
                  />
                  <SummaryCard
                    icon="pulse-outline"
                    title={`${graphData.stats.depthReached} degrees`}
                    subtitle="Maximum network reach"
                    tone="dark"
                  />
                </View>
              </>
            )}

            {activeTab === 'stats' && <GraphStatsPanel stats={graphData.stats} />}

            {activeTab === 'suggestions' && (
              <SuggestionsView
                suggestions={suggestions}
                loading={suggestionsLoading}
                error={suggestionsError}
                mutualsLoadingFor={mutualsLoadingFor}
                onRetry={() => {
                  setSuggestionsLoaded(false);
                  loadSuggestions();
                }}
                onViewMutuals={handleViewMutuals}
              />
            )}
          </Animated.View>
        ) : (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={30} color={theme.colors.primary} />
            <Text style={styles.stateTitle}>Your graph could not be loaded</Text>
            <Pressable style={styles.retryButton} onPress={loadGraphData}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {(selectedNode || selectedSuggestion) && <Pressable style={styles.overlay} onPress={closePanel} />}
      {(selectedNode || selectedSuggestion) && (
        <Animated.View style={[styles.panel, { transform: [{ translateY: panelY }] }]}>
          <View style={styles.panelHandle} />
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelEyebrow}>
                {selectedNode ? 'CONNECTION DETAILS' : 'WARM INTRODUCTIONS'}
              </Text>
              <Text style={styles.panelTitle}>
                {selectedNode
                  ? selectedNode.label
                  : selectedSuggestion?.user.full_name || selectedSuggestion?.user.first_name || 'Mutuals'}
              </Text>
            </View>
            <TouchableOpacity style={styles.panelClose} onPress={closePanel}>
              <Ionicons name="close" size={20} color={theme.colors.ink} />
            </TouchableOpacity>
          </View>
          {selectedNode ? (
            <View style={styles.nodeDetailGrid}>
              <DetailMetric label="Network depth" value={String(selectedNode.depth)} />
              <DetailMetric label="Relationship" value={selectedNode.isCurrentUser ? 'You' : depthLabel(selectedNode.depth)} />
            </View>
          ) : (
            <ScrollView style={styles.mutualList} showsVerticalScrollIndicator={false}>
              {selectedSuggestionMutuals.length ? (
                selectedSuggestionMutuals.map((mutual) => (
                  <View key={mutual.id} style={styles.mutualRow}>
                    <View style={styles.mutualAvatar}>
                      <Ionicons name="person-outline" size={18} color={theme.colors.accentDark} />
                    </View>
                    <View>
                      <Text style={styles.mutualName}>
                        {mutual.full_name || `${mutual.first_name || ''} ${mutual.last_name || ''}`.trim() || 'User'}
                      </Text>
                      <Text style={styles.mutualMeta}>{mutual.company || mutual.location || 'Connection'}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No mutual connections found.</Text>
              )}
            </ScrollView>
          )}
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function TabButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Ionicons name={icon} size={18} color={active ? theme.colors.primaryDark : theme.colors.textSecondary} />
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function SummaryCard({
  icon,
  title,
  subtitle,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  tone: 'teal' | 'orange' | 'dark';
}) {
  return (
    <InteractiveCard style={styles.summaryCard}>
      <View style={styles.summaryCardInner}>
        <View
          style={[
            styles.summaryIcon,
            tone === 'teal' && styles.summaryIconTeal,
            tone === 'orange' && styles.summaryIconOrange,
            tone === 'dark' && styles.summaryIconDark,
          ]}
        >
          <Ionicons
            name={icon}
            size={21}
            color={tone === 'teal' ? theme.colors.accentDark : tone === 'orange' ? theme.colors.primaryDark : '#FFFFFF'}
          />
        </View>
        <Text style={styles.summaryTitle}>{title}</Text>
        <Text style={styles.summarySubtitle}>{subtitle}</Text>
      </View>
    </InteractiveCard>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <View style={styles.centerState}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.stateText}>{label}</Text>
    </View>
  );
}

function SuggestionsView({
  suggestions,
  loading,
  error,
  mutualsLoadingFor,
  onRetry,
  onViewMutuals,
}: {
  suggestions: SuggestedUser[];
  loading: boolean;
  error: string | null;
  mutualsLoadingFor: string | null;
  onRetry: () => void;
  onViewMutuals: (suggestion: SuggestedUser) => void;
}) {
  if (loading) return <LoadingState label="Finding people you may know..." />;

  if (error) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="alert-circle-outline" size={30} color={theme.colors.primary} />
        <Text style={styles.stateTitle}>{error}</Text>
        <Pressable style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (!suggestions.length) {
    return (
      <View style={styles.centerState}>
        <Ionicons name="people-outline" size={30} color={theme.colors.accent} />
        <Text style={styles.stateTitle}>No suggestions yet</Text>
        <Text style={styles.stateText}>Add contacts and connections to unlock warmer recommendations.</Text>
      </View>
    );
  }

  return (
    <View style={styles.suggestionGrid}>
      {suggestions.map((suggestion) => (
        <InteractiveCard key={suggestion.user.id} style={styles.suggestionCard}>
          <View style={styles.suggestionCardInner}>
            <View style={styles.suggestionTop}>
              <View style={styles.suggestionAvatar}>
                <Ionicons name="person-outline" size={22} color={theme.colors.primaryDark} />
              </View>
              <View style={styles.suggestionIdentity}>
                <Text style={styles.suggestionName}>
                  {suggestion.user.full_name ||
                    `${suggestion.user.first_name || ''} ${suggestion.user.last_name || ''}`.trim() ||
                    'User'}
                </Text>
                <Text style={styles.suggestionMeta}>
                  {suggestion.user.company || suggestion.user.location || 'Community member'}
                </Text>
              </View>
              <View style={styles.mutualBadge}>
                <Text style={styles.mutualBadgeText}>{suggestion.mutualCount} mutual</Text>
              </View>
            </View>
            <View style={styles.reasonWrap}>
              {suggestion.reasons.slice(0, 3).map((reason) => (
                <View key={`${suggestion.user.id}-${reason}`} style={styles.reasonChip}>
                  <Text style={styles.reasonText}>{reason}</Text>
                </View>
              ))}
            </View>
            <Pressable style={styles.viewMutualsButton} onPress={() => onViewMutuals(suggestion)}>
              {mutualsLoadingFor === suggestion.user.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.viewMutualsText}>View mutuals</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        </InteractiveCard>
      ))}
    </View>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailMetric}>
      <Text style={styles.detailMetricLabel}>{label}</Text>
      <Text style={styles.detailMetricValue}>{value}</Text>
    </View>
  );
}

function depthLabel(depth: number) {
  if (depth === 1) return 'Direct connection';
  if (depth === 2) return 'Friend of a friend';
  if (depth === 3) return 'Extended network';
  return 'Distant connection';
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  orbOne: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(224, 91, 45, 0.08)',
  },
  orbTwo: {
    position: 'absolute',
    bottom: -140,
    left: -100,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(15, 159, 154, 0.07)',
  },
  topBar: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0E2D7',
    backgroundColor: 'rgba(255, 253, 250, 0.94)',
  },
  topBarInner: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarTitleWrap: {
    alignItems: 'center',
  },
  eyebrow: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    letterSpacing: 2,
    color: theme.colors.primary,
  },
  topBarTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.ink,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBD8CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 44,
  },
  scrollContentDesktop: {
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 26,
  },
  hero: {
    minHeight: 250,
    borderRadius: 30,
    overflow: 'hidden',
    padding: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  heroGlow: {
    position: 'absolute',
    right: -70,
    top: -100,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(255, 205, 180, 0.15)',
  },
  heroCopy: {
    flex: 1,
    maxWidth: 640,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBadgeText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
    color: '#FFD5C5',
  },
  heroTitle: {
    marginTop: 14,
    fontFamily: theme.fonts.bold,
    fontSize: 38,
    lineHeight: 42,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    marginTop: 10,
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFE9E0',
  },
  heroMetrics: {
    flexDirection: 'row',
    gap: 10,
  },
  heroMetricsMobile: {
    display: 'none',
  },
  metric: {
    width: 94,
    height: 94,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontFamily: theme.fonts.bold,
    fontSize: 27,
    color: '#FFFFFF',
  },
  metricLabel: {
    marginTop: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: '#FFD8C9',
  },
  tabs: {
    marginTop: 18,
    flexDirection: 'row',
    padding: 5,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EEDFD2',
    backgroundColor: '#FFF1E7',
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.colors.primaryDark,
  },
  sectionHeader: {
    marginTop: 22,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionEyebrow: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: theme.colors.primary,
  },
  sectionTitle: {
    marginTop: 2,
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.ink,
  },
  depthControl: {
    flexDirection: 'row',
    gap: 6,
  },
  depthButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBD8CA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  depthButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  depthButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  depthButtonTextActive: {
    color: '#FFFFFF',
  },
  graphCard: {
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDFD2',
    padding: 10,
  },
  summaryGrid: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 14,
  },
  stack: {
    flexDirection: 'column',
  },
  summaryCard: {
    flex: 1,
    minHeight: 140,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDFD2',
  },
  summaryCardInner: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },
  summaryIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  summaryIconTeal: {
    backgroundColor: theme.colors.surfaceAccent,
  },
  summaryIconOrange: {
    backgroundColor: theme.colors.surfaceMuted,
  },
  summaryIconDark: {
    backgroundColor: theme.colors.ink,
  },
  summaryTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 20,
    color: theme.colors.ink,
  },
  summarySubtitle: {
    marginTop: 3,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  centerState: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    marginTop: 10,
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.ink,
    textAlign: 'center',
  },
  stateText: {
    marginTop: 8,
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 14,
    minHeight: 42,
    borderRadius: 14,
    paddingHorizontal: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButtonText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  suggestionGrid: {
    marginTop: 20,
    gap: 14,
  },
  suggestionCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEDFD2',
  },
  suggestionCardInner: {
    padding: 18,
  },
  suggestionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  suggestionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionIdentity: {
    flex: 1,
  },
  suggestionName: {
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    color: theme.colors.ink,
  },
  suggestionMeta: {
    marginTop: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  mutualBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceAccent,
  },
  mutualBadgeText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
    color: theme.colors.accentDark,
  },
  reasonWrap: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  reasonChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#F0DDCF',
    backgroundColor: '#FFF7F1',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  reasonText: {
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    color: theme.colors.primaryDark,
  },
  viewMutualsButton: {
    marginTop: 16,
    minHeight: 42,
    borderRadius: 14,
    backgroundColor: theme.colors.ink,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMutualsText: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    backgroundColor: 'rgba(22, 14, 11, 0.42)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    maxHeight: '70%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  panelHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4D6CB',
    alignSelf: 'center',
    marginTop: 10,
  },
  panelHeader: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelEyebrow: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 10,
    letterSpacing: 1.6,
    color: theme.colors.primary,
  },
  panelTitle: {
    marginTop: 2,
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    color: theme.colors.ink,
  },
  panelClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FAF3ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDetailGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  detailMetric: {
    flex: 1,
    minHeight: 90,
    borderRadius: 16,
    backgroundColor: '#FFF7F1',
    padding: 14,
    justifyContent: 'center',
  },
  detailMetricLabel: {
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  detailMetricValue: {
    marginTop: 4,
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.ink,
  },
  mutualList: {
    maxHeight: 340,
  },
  mutualRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E8E0',
  },
  mutualAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutualName: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    color: theme.colors.ink,
  },
  mutualMeta: {
    marginTop: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyText: {
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
