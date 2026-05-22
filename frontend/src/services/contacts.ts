import * as Contacts from 'expo-contacts';

export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
}

export class ContactsService {
  static async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      return false;
    }
  }

  static async getPermissionStatus(): Promise<boolean> {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking contacts permission:', error);
      return false;
    }
  }

  static async readContacts(): Promise<ContactInfo[]> {
    try {
      const hasPermission = await this.getPermissionStatus();
      if (!hasPermission) {
        const granted = await this.requestPermission();
        if (!granted) {
          throw new Error('Contacts permission not granted');
        }
      }

      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Emails,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
        ],
      });

      const contacts: ContactInfo[] = [];

      for (const contact of data) {
        const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim();
        
        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          for (const phoneNumber of contact.phoneNumbers) {
            if (phoneNumber.number) {
              contacts.push({
                name: name || phoneNumber.label || 'Unknown',
                phone: this.normalizePhoneNumber(phoneNumber.number),
                email: contact.emails?.[0]?.email,
              });
            }
          }
        }
      }

      return contacts;
    } catch (error) {
      console.error('Error reading contacts:', error);
      throw error;
    }
  }

  static normalizePhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `+91${cleaned}`;
    }
    
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    
    if (cleaned.length === 13 && cleaned.startsWith('91')) {
      return `+${cleaned}`;
    }
    
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return `+${cleaned}`;
    }
    
    return `+${cleaned}`;
  }

  static async filterContactsByCountry(contacts: ContactInfo[], countryCode: string = '+91'): Promise<ContactInfo[]> {
    return contacts.filter(contact => contact.phone.startsWith(countryCode));
  }

  static deduplicateContacts(contacts: ContactInfo[]): ContactInfo[] {
    const seen = new Set<string>();
    const unique: ContactInfo[] = [];

    for (const contact of contacts) {
      if (!seen.has(contact.phone)) {
        seen.add(contact.phone);
        unique.push(contact);
      }
    }

    return unique;
  }
}

export default ContactsService;
