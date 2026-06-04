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

export interface MutualUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  location?: string | null;
  company?: string | null;
}

export interface MutualsResponse {
  count: number;
  mutuals: MutualUser[];
}

export interface SuggestedUser {
  user: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
    company: string | null;
    school: string | null;
  };
  mutualCount: number;
  score: number;
  reasons: string[];
}

export interface SuggestionsResponse {
  suggestions: SuggestedUser[];
  count: number;
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

  async getMutuals(targetUserId: string, token: string, limit: number = 20): Promise<MutualsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/graph/mutuals/${targetUserId}?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch mutuals');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching mutuals:', error);
      throw error;
    }
  }

  async getSuggestions(token: string, limit: number = 20): Promise<SuggestionsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/graph/suggestions?limit=${limit}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      throw error;
    }
  }
}

export const graphService = new GraphService();
