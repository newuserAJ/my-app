import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GraphStats } from '../services/graph';

const { width: screenWidth } = Dimensions.get('window');

interface GraphStatsProps {
  stats: GraphStats;
}

export const GraphStatsPanel = ({ stats }: GraphStatsProps) => {
  const depthDistribution = [
    { label: 'You', count: stats.depthCounts.depth0, color: '#C35129' },
    { label: '1st Degree', count: stats.depthCounts.depth1, color: '#4ECDC4' },
    { label: '2nd Degree', count: stats.depthCounts.depth2, color: '#45B7D1' },
    { label: '3rd Degree', count: stats.depthCounts.depth3, color: '#96CEB4' },
    { label: '4th Degree', count: stats.depthCounts.depth4, color: '#FFEAA7' },
  ];

  const maxCount = Math.max(...depthDistribution.map(d => d.count)) || 1;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Summary Cards */}
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="people" size={24} color="#C35129" />
          </View>
          <Text style={styles.cardValue}>{stats.totalNodes}</Text>
          <Text style={styles.cardLabel}>Total Network Size</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.cardIconContainer}>
            <Ionicons name="git-branch" size={24} color="#4ECDC4" />
          </View>
          <Text style={styles.cardValue}>{stats.totalEdges}</Text>
          <Text style={styles.cardLabel}>Connections</Text>
        </View>
      </View>

      {/* Depth Distribution Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Depth Distribution</Text>
        
        {depthDistribution.map((item, index) => (
          <View key={index} style={styles.depthRow}>
            <View style={styles.depthLabel}>
              <View
                style={[
                  styles.depthColorDot,
                  { backgroundColor: item.color },
                ]}
              />
              <Text style={styles.depthLabelText}>{item.label}</Text>
            </View>

            <View style={styles.depthBarContainer}>
              <View
                style={[
                  styles.depthBar,
                  {
                    width: `${(item.count / maxCount) * 100}%`,
                    backgroundColor: item.color,
                  },
                ]}
              />
            </View>

            <Text style={styles.depthCount}>{item.count}</Text>
          </View>
        ))}
      </View>

      {/* Network Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network Insights</Text>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="analytics" size={20} color="#45B7D1" />
            <Text style={styles.insightTitle}>Reach</Text>
          </View>
          <Text style={styles.insightValue}>
            {stats.depthReached === 0 ? '0 hops' : `${stats.depthReached} hops away`}
          </Text>
          <Text style={styles.insightDescription}>
            Maximum network depth reached
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="git-network" size={20} color="#96CEB4" />
            <Text style={styles.insightTitle}>Network Density</Text>
          </View>
          <Text style={styles.insightValue}>
            {stats.totalNodes > 1
              ? ((stats.totalEdges / ((stats.totalNodes * (stats.totalNodes - 1)) / 2)) * 100).toFixed(1)
              : 0}
            %
          </Text>
          <Text style={styles.insightDescription}>
            Percentage of possible connections
          </Text>
        </View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="trending-up" size={20} color="#FFEAA7" />
            <Text style={styles.insightTitle}>Direct Connections</Text>
          </View>
          <Text style={styles.insightValue}>{stats.depthCounts.depth1}</Text>
          <Text style={styles.insightDescription}>
            People directly connected to you
          </Text>
        </View>
      </View>

      {/* Depth Explanation */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Understanding Depths</Text>
        
        <View style={styles.explanationCard}>
          <View style={[styles.expLabel, { backgroundColor: '#C35129' }]}>
            <Text style={styles.expLabelText}>0</Text>
          </View>
          <View style={styles.expContent}>
            <Text style={styles.expTitle}>You</Text>
            <Text style={styles.expDescription}>Your profile in the network</Text>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <View style={[styles.expLabel, { backgroundColor: '#4ECDC4' }]}>
            <Text style={styles.expLabelText}>1</Text>
          </View>
          <View style={styles.expContent}>
            <Text style={styles.expTitle}>Direct Friends</Text>
            <Text style={styles.expDescription}>People connected directly to you</Text>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <View style={[styles.expLabel, { backgroundColor: '#45B7D1' }]}>
            <Text style={styles.expLabelText}>2</Text>
          </View>
          <View style={styles.expContent}>
            <Text style={styles.expTitle}>Friends of Friends</Text>
            <Text style={styles.expDescription}>
              People connected through one mutual friend
            </Text>
          </View>
        </View>

        <View style={styles.explanationCard}>
          <View style={[styles.expLabel, { backgroundColor: '#96CEB4' }]}>
            <Text style={styles.expLabelText}>3</Text>
          </View>
          <View style={styles.expContent}>
            <Text style={styles.expTitle}>Extended Network</Text>
            <Text style={styles.expDescription}>
              People connected through two mutual friends
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 24,
    fontFamily: 'Afacad-Bold',
    color: '#000000',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    fontFamily: 'Afacad-Regular',
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Afacad-Bold',
    color: '#000000',
    marginBottom: 12,
  },
  depthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  depthLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
    gap: 8,
  },
  depthColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  depthLabelText: {
    fontSize: 13,
    color: '#555555',
    fontFamily: 'Afacad-Regular',
  },
  depthBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#EEEEEE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  depthBar: {
    height: '100%',
    borderRadius: 4,
  },
  depthCount: {
    width: 35,
    textAlign: 'right',
    fontSize: 13,
    fontFamily: 'Afacad-SemiBold',
    color: '#000000',
  },
  insightCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontFamily: 'Afacad-SemiBold',
    color: '#000000',
  },
  insightValue: {
    fontSize: 20,
    fontFamily: 'Afacad-Bold',
    color: '#C35129',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Afacad-Regular',
  },
  explanationCard: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  expLabel: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expLabelText: {
    fontSize: 16,
    fontFamily: 'Afacad-Bold',
    color: '#FFFFFF',
  },
  expContent: {
    flex: 1,
    justifyContent: 'center',
  },
  expTitle: {
    fontSize: 14,
    fontFamily: 'Afacad-SemiBold',
    color: '#000000',
    marginBottom: 2,
  },
  expDescription: {
    fontSize: 12,
    color: '#999999',
    fontFamily: 'Afacad-Regular',
  },
  footer: {
    height: 20,
  },
});
