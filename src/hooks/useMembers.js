import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const useMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authFetch } = useAuth();

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authFetch('/users/');
      
      if (response.success || response.status === 'success') {
        // Filter only members from the response
        const allUsers = response.data?.users || response.data || [];
        const membersOnly = allUsers.filter(user => user.role === 'member');
        setMembers(membersOnly);
      } else {
        throw new Error(response.message || 'Failed to fetch members');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to fetch members: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (memberData) => {
    try {
      const response = await authFetch('/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({...memberData, role: 'member'}),
      });

      if (response.success || response.status === 'success') {
        const newMember = response.data;
        setMembers(prev => [...prev, newMember]);
        toast.success('Member added successfully!');
        return newMember;
      } else {
        throw new Error(response.message || 'Failed to add member');
      }
    } catch (err) {
      toast.error(`Failed to add member: ${err.message}`);
      throw err;
    }
  };

  const updateMember = async (memberId, memberData) => {
    try {
      const response = await authFetch(`/auth/users/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(memberData),
      });

      if (response.success || response.status === 'success') {
        const updatedMember = response.data;
        setMembers(prev => 
          prev.map(member => 
            member._id === memberId ? updatedMember : member
          )
        );
        toast.success('Member updated successfully!');
        return updatedMember;
      } else {
        throw new Error(response.message || 'Failed to update member');
      }
    } catch (err) {
      toast.error(`Failed to update member: ${err.message}`);
      throw err;
    }
  };

  const deleteMember = async (memberId) => {
    try {
      const response = await authFetch(`/users/${memberId}`, {
        method: 'DELETE',
      });

      if (response.success || response.status === 'success') {
        setMembers(prev => prev.filter(member => member._id !== memberId));
        toast.success('Member deleted successfully!');
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete member');
      }
    } catch (err) {
      toast.error(`Failed to delete member: ${err.message}`);
      throw err;
    }
  };

  const getMember = async (memberId) => {
    try {
      const response = await authFetch(`/users/${memberId}`);
      
      if (response.success || response.status === 'success') {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch member');
      }
    } catch (err) {
      toast.error(`Failed to fetch member: ${err.message}`);
      throw err;
    }
  };

  const searchMembers = (searchTerm, filters = {}) => {
    if (!searchTerm && Object.keys(filters).length === 0) {
      return members;
    }

    return members.filter(member => {
      // Search term matching
      const matchesSearch = !searchTerm || 
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm);

      // Filter matching
      const matchesFilters = Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        return member[key] === value;
      });

      return matchesSearch && matchesFilters;
    });
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return {
    members,
    loading,
    error,
    fetchMembers,
    addMember,
    updateMember,
    deleteMember,
    getMember,
    searchMembers,
    refetch: fetchMembers
  };
};