import GhostAdminAPI from '@tryghost/admin-api';

class GhostService {
  constructor() {
    this.api = new GhostAdminAPI({
      url: process.env.GHOST_URL || 'https://blog.apromarketing.com',
      key: process.env.GHOST_ADMIN_API_KEY,
      version: 'v5.0'
    });

    this.isEnabled = this.validateConfig();
  }

  validateConfig() {
    if (!process.env.GHOST_ADMIN_API_KEY || process.env.GHOST_ADMIN_API_KEY === 'YOUR_GHOST_ADMIN_API_KEY_HERE') {
      console.warn('⚠️ Ghost Admin API key not configured. Newsletter integration disabled.');
      return false;
    }

    if (!process.env.GHOST_URL) {
      console.warn('⚠️ Ghost URL not configured. Using default: https://blog.apromarketing.com');
    }

    return true;
  }

  /**
   * Create a new member in Ghost
   * @param {Object} memberData - Member data from newsletter form
   * @param {string} memberData.name - Member name
   * @param {string} memberData.email - Member email
   * @param {string} [memberData.company] - Company name
   * @param {string} [memberData.website] - Website URL
   * @returns {Promise<Object>} Created member or error
   */
  async createMember(memberData) {
    if (!this.isEnabled) {
      throw new Error('Ghost Admin API not configured');
    }

    try {
      const ghostMember = {
        name: memberData.name,
        email: memberData.email,
        labels: ['newsletter-signup'],
        note: this.formatMemberNote(memberData),
        subscribed: true
      };

      // Add company label if provided
      if (memberData.company) {
        ghostMember.labels.push(`company-${memberData.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
      }

      console.log(`📧 Creating Ghost member for: ${memberData.email}`);
      const member = await this.api.members.add(ghostMember);
      console.log(`✅ Ghost member created successfully: ${member.id}`);

      return member;
    } catch (error) {
      console.error('❌ Failed to create Ghost member:', error.message);

      // Handle duplicate email error
      if (error.message && error.message.includes('already exists')) {
        console.log(`📝 Member ${memberData.email} already exists in Ghost`);
        return { exists: true, email: memberData.email };
      }

      throw error;
    }
  }

  /**
   * Bulk create members for migration
   * @param {Array} membersData - Array of member data objects
   * @returns {Promise<Object>} Migration results
   */
  async bulkCreateMembers(membersData) {
    if (!this.isEnabled) {
      throw new Error('Ghost Admin API not configured');
    }

    const results = {
      success: 0,
      failed: 0,
      existing: 0,
      errors: []
    };

    console.log(`📦 Starting bulk migration of ${membersData.length} members to Ghost...`);

    for (const memberData of membersData) {
      try {
        const result = await this.createMember(memberData);

        if (result.exists) {
          results.existing++;
        } else {
          results.success++;
        }

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        results.failed++;
        results.errors.push({
          email: memberData.email,
          error: error.message
        });
      }
    }

    console.log(`📊 Migration completed: ${results.success} created, ${results.existing} existing, ${results.failed} failed`);
    return results;
  }

  /**
   * Get Ghost newsletters for subscription
   * @returns {Promise<Array>} List of newsletters
   */
  async getNewsletters() {
    if (!this.isEnabled) {
      throw new Error('Ghost Admin API not configured');
    }

    try {
      const newsletters = await this.api.newsletters.browse();
      console.log(`📰 Found ${newsletters.length} newsletters in Ghost`);
      return newsletters;
    } catch (error) {
      console.error('❌ Failed to fetch newsletters:', error.message);
      throw error;
    }
  }

  /**
   * Format member note from form data
   * @param {Object} memberData - Member data
   * @returns {string} Formatted note
   */
  formatMemberNote(memberData) {
    const noteParts = [];

    if (memberData.company) {
      noteParts.push(`Company: ${memberData.company}`);
    }

    if (memberData.website) {
      noteParts.push(`Website: ${memberData.website}`);
    }

    noteParts.push(`Source: Newsletter Signup`);
    noteParts.push(`Date: ${new Date().toISOString().split('T')[0]}`);

    return noteParts.join(' | ');
  }

  /**
   * Delete a member from Ghost (for cleanup purposes)
   * @param {string} memberId - Ghost member ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteMember(memberId) {
    if (!this.isEnabled) {
      throw new Error('Ghost Admin API not configured');
    }

    try {
      await this.api.members.destroy(memberId);
      console.log(`🗑️ Ghost member deleted: ${memberId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to delete Ghost member ${memberId}:`, error.message);
      throw error;
    }
  }

  /**
   * Test Ghost API connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    if (!this.isEnabled) {
      return false;
    }

    try {
      const site = await this.api.site.read();
      console.log(`✅ Ghost connection successful: ${site.title}`);
      return true;
    } catch (error) {
      console.error('❌ Ghost connection failed:', error.message);
      return false;
    }
  }
}

let ghostServiceInstance = null;

export default {
  getInstance() {
    if (!ghostServiceInstance) {
      ghostServiceInstance = new GhostService();
    }
    return ghostServiceInstance;
  },

  // Proxy methods for easier usage
  async createMember(memberData) {
    return this.getInstance().createMember(memberData);
  },

  async bulkCreateMembers(membersData) {
    return this.getInstance().bulkCreateMembers(membersData);
  },

  async testConnection() {
    return this.getInstance().testConnection();
  },

  async getNewsletters() {
    return this.getInstance().getNewsletters();
  },

  async deleteMember(memberId) {
    return this.getInstance().deleteMember(memberId);
  }
};