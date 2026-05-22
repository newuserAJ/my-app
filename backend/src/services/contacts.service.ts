import { supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';
import { BaseService } from './base.service';

interface ContactInput {
  name: string;
  phone: string;
  email?: string;
}

export class ContactsService extends BaseService {
  constructor() {
    super(supabaseAdmin);
  }

  static async uploadContacts(userId: string, contacts: ContactInput[]): Promise<void> {
    try {
      if (!contacts || contacts.length === 0) {
        throw new Error('At least one contact is required');
      }

      const contactRecords = contacts.map(contact => ({
        user_id: userId,
        contact_name: contact.name,
        contact_phone: contact.phone,
        contact_email: contact.email || null,
      }));

      const { error } = await supabaseAdmin
        .from('user_contacts')
        .insert(contactRecords)
        .select();

      if (error) {
        logger.error('Error uploading contacts:', { userId, error });
        throw error;
      }

      await this.matchContacts(userId);

      logger.info('Contacts uploaded successfully:', {
        userId,
        count: contacts.length,
      });
    } catch (error) {
      logger.error('Error in uploadContacts:', error);
      throw error;
    }
  }

  static async matchContacts(userId: string): Promise<void> {
    try {
      const { data: userContacts, error: contactsError } = await supabaseAdmin
        .from('user_contacts')
        .select('*')
        .eq('user_id', userId)
        .is('matched_user_id', null);

      if (contactsError) {
        logger.error('Error fetching user contacts:', contactsError);
        return;
      }

      for (const contact of userContacts || []) {
        const { data: matchedUsers, error: matchError } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('phone_number', contact.contact_phone)
          .single();

        if (matchError && matchError.code !== 'PGRST116') {
          logger.warn('Error matching contact:', { contact, matchError });
          continue;
        }

        if (matchedUsers) {
          await supabaseAdmin
            .from('user_contacts')
            .update({
              matched_user_id: matchedUsers.id,
              is_registered: true,
            })
            .eq('id', contact.id);

          const minUserId = userId < matchedUsers.id ? userId : matchedUsers.id;
          const maxUserId = userId > matchedUsers.id ? userId : matchedUsers.id;

          await supabaseAdmin
            .from('user_connections')
            .insert({
              user_a_id: minUserId,
              user_b_id: maxUserId,
              connected_via_contacts: true,
            })
            .select();
        }
      }

      logger.info('Contacts matched successfully:', { userId });
    } catch (error) {
      logger.error('Error in matchContacts:', error);
    }
  }

  static async getUserContacts(userId: string): Promise<ContactInput[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_contacts')
        .select('contact_name, contact_phone, contact_email')
        .eq('user_id', userId);

      if (error) {
        logger.error('Error fetching user contacts:', { userId, error });
        throw error;
      }

      return (data || []).map(contact => ({
        name: contact.contact_name,
        phone: contact.contact_phone,
        email: contact.contact_email || undefined,
      }));
    } catch (error) {
      logger.error('Error in getUserContacts:', error);
      throw error;
    }
  }

  static async getUserConnections(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_connections')
        .select('user_a_id, user_b_id')
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

      if (error) {
        logger.error('Error fetching user connections:', { userId, error });
        throw error;
      }

      const connectionIds = new Set<string>();

      for (const connection of data || []) {
        if (connection.user_a_id === userId) {
          connectionIds.add(connection.user_b_id);
        } else {
          connectionIds.add(connection.user_a_id);
        }
      }

      return Array.from(connectionIds);
    } catch (error) {
      logger.error('Error in getUserConnections:', error);
      throw error;
    }
  }

  static async getConnectedUsers(userId: string): Promise<any[]> {
    try {
      const connectionIds = await this.getUserConnections(userId);

      if (connectionIds.length === 0) {
        return [];
      }

      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, first_name, last_name, full_name, avatar_url, phone_number')
        .in('id', connectionIds);

      if (error) {
        logger.error('Error fetching connected users:', { userId, error });
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Error in getConnectedUsers:', error);
      throw error;
    }
  }
}
