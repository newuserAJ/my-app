import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GraphStats } from '../services/graph';
import { theme } from '../theme';
import { InteractiveCard } from './InteractiveCard';

interface GraphStatsProps {
  stats: GraphStats;
}

export const GraphStatsPanel = ({ stats }: GraphStatsProps) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 820;
  const density = stats.totalNodes > 1
    ? ((stats.totalEdges / ((stats.totalNodes * (stats.totalNodes - 1)) / 2)) * 100).toFixed(1)
    : '0';

  const depthDistribution = [
    { label: 'You', count: stats.depthCounts.depth0, color: theme.colors.primary },
    { label: '1st degree', count: stats.depthCounts.depth1, color: theme.colors.accent },
    { label: '2nd degree', count: stats.depthCounts.depth2, color: '#4C8EBF' },
    { label: '3rd degree', count: stats.depthCounts.depth3, color: '#80A66A' },
    { label: '4th degree', count: stats.depthCounts.depth4, color: '#D9A441' },
  ];
  const maxCount = Math.max(...depthDistribution.map(item => item.count), 1);

  return (
    <View style={styles.container}>
      <View style={[styles.summaryGrid, !isDesktop && styles.stack]}>
        <SummaryCard
          icon="people-outline"
          label="Network size"
          value={String(stats.totalNodes)}
          detail="People visible in your current reach"
          color={theme.colors.primary}
        />
        <SummaryCard
          icon="git-branch-outline"
          label="Connections"
          value={String(stats.totalEdges)}
          detail="Relationships forming your network"
          color={theme.colors.accent}
        />
        <SummaryCard
          icon="pulse-outline"
          label="Network density"
          value={`${density}%`}
          detail="How connected your visible network is"
          color="#4C8EBF"
        />
      </View>

      <View style={[styles.contentGrid, !isDesktop && styles.stack]}>
        <View style={styles.panel}>
          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.eyebrow}>RELATIONSHIP LAYERS</Text>
              <Text style={styles.sectionTitle}>Network depth</Text>
            </View>
            <View style={styles.reachPill}>
              <Ionicons name="radio-outline" size={15} color={theme.colors.accentDark} />
              <Text style={styles.reachPillText}>{stats.depthReached} hops reached</Text>
            </View>
          </View>

          <View style={styles.chart}>
            {depthDistribution.map(item => (
              <View key={item.label} style={styles.depthRow}>
                <View style={styles.depthMeta}>
                  <View style={[styles.dot, { backgroundColor: item.color }]} />
                  <Text style={styles.depthLabel}>{item.label}</Text>
                  <Text style={styles.depthCount}>{item.count}</Text>
                </View>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={[item.color, `${item.color}99`] as any}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.barFill, { width: `${Math.max((item.count / maxCount) * 100, item.count ? 7 : 0)}%` }]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.eyebrow}>WHAT IT MEANS</Text>
          <Text style={styles.sectionTitle}>Your network at a glance</Text>
          <View style={styles.insightList}>
            <Insight
              icon="flash-outline"
              title="Direct relationships"
              value={String(stats.depthCounts.depth1)}
              description="People you can reach without an introduction."
              color={theme.colors.primary}
            />
            <Insight
              icon="people-circle-outline"
              title="Warm introductions"
              value={String(stats.depthCounts.depth2)}
              description="People one mutual connection away."
              color={theme.colors.accent}
            />
            <Insight
              icon="telescope-outline"
              title="Extended reach"
              value={String(stats.depthCounts.depth3 + stats.depthCounts.depth4)}
              description="New possibilities deeper in your network."
              color="#4C8EBF"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

function SummaryCard({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <InteractiveCard style={styles.summaryCard}>
      <View style={styles.summaryCardInner}>
        <View style={[styles.iconBubble, { backgroundColor: `${color}16` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={styles.summaryValue}>{value}</Text>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={styles.summaryDetail}>{detail}</Text>
      </View>
    </InteractiveCard>
  );
}

function Insight({
  icon,
  title,
  value,
  description,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  value: string;
  description: string;
  color: string;
}) {
  return (
    <View style={styles.insight}>
      <View style={[styles.insightIcon, { backgroundColor: `${color}14` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.insightCopy}>
        <Text style={styles.insightTitle}>{title}</Text>
        <Text style={styles.insightDescription}>{description}</Text>
      </View>
      <Text style={[styles.insightValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18, paddingBottom: 30 },
  summaryGrid: { flexDirection: 'row', gap: 16 },
  stack: { flexDirection: 'column' },
  summaryCard: {
    flex: 1,
    minWidth: 0,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#F0DED1',
  },
  summaryCardInner: { padding: 22 },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  summaryValue: { fontFamily: theme.fonts.bold, fontSize: 32, color: theme.colors.ink },
  summaryLabel: { fontFamily: theme.fonts.semiBold, fontSize: 16, color: theme.colors.text, marginTop: 2 },
  summaryDetail: { fontFamily: theme.fonts.regular, fontSize: 14, lineHeight: 19, color: theme.colors.textSecondary, marginTop: 5 },
  contentGrid: { flexDirection: 'row', gap: 18, alignItems: 'stretch' },
  panel: {
    flex: 1,
    minWidth: 0,
    padding: 24,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: '#F0DED1',
  },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  eyebrow: { fontFamily: theme.fonts.bold, fontSize: 11, letterSpacing: 1.4, color: theme.colors.primary },
  sectionTitle: { fontFamily: theme.fonts.bold, fontSize: 23, color: theme.colors.ink, marginTop: 4 },
  reachPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceAccent,
  },
  reachPillText: { fontFamily: theme.fonts.semiBold, fontSize: 12, color: theme.colors.accentDark },
  chart: { gap: 17, marginTop: 28 },
  depthRow: { gap: 8 },
  depthMeta: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 8 },
  depthLabel: { flex: 1, fontFamily: theme.fonts.semiBold, fontSize: 14, color: theme.colors.text },
  depthCount: { fontFamily: theme.fonts.bold, fontSize: 14, color: theme.colors.ink },
  barTrack: { height: 8, borderRadius: 999, overflow: 'hidden', backgroundColor: '#F4EAE2' },
  barFill: { height: '100%', borderRadius: 999 },
  insightList: { gap: 12, marginTop: 22 },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#FFF9F5',
    borderWidth: 1,
    borderColor: '#F4E7DD',
  },
  insightIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  insightCopy: { flex: 1 },
  insightTitle: { fontFamily: theme.fonts.semiBold, fontSize: 15, color: theme.colors.text },
  insightDescription: { fontFamily: theme.fonts.regular, fontSize: 13, lineHeight: 17, color: theme.colors.textSecondary, marginTop: 2 },
  insightValue: { fontFamily: theme.fonts.bold, fontSize: 24 },
});
