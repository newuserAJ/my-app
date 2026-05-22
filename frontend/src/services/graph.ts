import { API_BASE_URL } from './api';

export interface GraphNode {
  id: string;
  label: string;
  depth: number;
  avatar?: string;
  isCurrentUser: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  connected_via_contacts?: boolean;
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  depthReached: number;
  depthCounts: {
    depth0: number;
    depth1: number;
    depth2: number;
    depth3: number;
    depth4: number;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
}

export interface DepthAnalysis {
  totalUsers: number;
  directConnections: number;
  secondDegree: number;
  thirdDegree: number;
  fourthDegree: number;
  depthCounts: {
    0: number;
    1: number;
    2: number;
    3: number;
    4: number;
  };
  averageConnectionsPerUser: number;
}

class GraphService {
  async getNetworkGraph(depth: number = 3, token: string): Promise<GraphData> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/graph/network?depth=${depth}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch graph network');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching network graph:', error);
      throw error;
    }
  }

  async getDepthAnalysis(token: string): Promise<DepthAnalysis> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/graph/depth-analysis`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch depth analysis');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching depth analysis:', error);
      throw error;
    }
  }
}

export const graphService = new GraphService();
