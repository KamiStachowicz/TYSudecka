import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as MailComposer from 'expo-mail-composer';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useStyles, useTheme } from '@/lib/settings';
import { NEWSROOM_EMAIL, type Palette } from '@/lib/theme';

const MAX_ATTACHMENTS = 5;

type Attachment = { uri: string; isVideo: boolean };

function notify(title: string, message: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

// Bez własnego serwera: zgłoszenie idzie e-mailem z telefonu użytkownika na adres redakcji,
// razem ze zdjęciami i filmami jako załącznikami.
export default function SendTipScreen() {
  const styles = useStyles(makeStyles);
  const { c } = useTheme();
  const [message, setMessage] = useState('');
  const [place, setPlace] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);

  const pick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_ATTACHMENTS - attachments.length,
      quality: 0.8,
    });
    if (result.canceled) return;
    const picked = result.assets.map((a) => ({ uri: a.uri, isVideo: a.type === 'video' }));
    setAttachments((prev) => [...prev, ...picked].slice(0, MAX_ATTACHMENTS));
  };

  const body = () =>
    [
      message.trim(),
      '',
      '---',
      place.trim() && `Miejsce: ${place.trim()}`,
      name.trim() && `Imię: ${name.trim()}`,
      phone.trim() && `Telefon: ${phone.trim()}`,
      'Wysłano z aplikacji Telewizja Sudecka',
    ]
      .filter((l) => l !== '')
      .join('\n');

  const send = async () => {
    if (message.trim().length < 10) {
      notify('Opisz, co się stało', 'Napisz kilka zdań: co, gdzie i kiedy się wydarzyło.');
      return;
    }
    const subject = `Informacja od widza${place.trim() ? ` – ${place.trim()}` : ''}`;
    setSending(true);
    try {
      if (await MailComposer.isAvailableAsync()) {
        const res = await MailComposer.composeAsync({
          recipients: [NEWSROOM_EMAIL],
          subject,
          body: body(),
          attachments: attachments.map((a) => a.uri),
        });
        if (res.status === MailComposer.MailComposerStatus.SENT) {
          notify('Dziękujemy!', 'Twoja informacja trafiła do redakcji Telewizji Sudeckiej.');
          router.back();
        }
        return;
      }
      // Brak skonfigurowanej poczty w telefonie: otwieramy link mailto (bez załączników).
      const url = `mailto:${NEWSROOM_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body())}`;
      await Linking.openURL(url);
      if (attachments.length) {
        notify('Dołącz zdjęcia ręcznie', 'Twoja aplikacja pocztowa nie pozwala dodać załączników automatycznie.');
      }
    } catch {
      notify('Nie udało się otworzyć poczty', `Napisz bezpośrednio na adres ${NEWSROOM_EMAIL}.`);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.intro}>
          <Ionicons name="megaphone-outline" size={26} color={c.primary} />
          <Text style={styles.introText}>
            Widzisz coś ważnego w swojej okolicy? Wyślij opis, zdjęcia albo film, a redakcja Telewizji Sudeckiej się tym
            zajmie.
          </Text>
        </View>

        <Text style={styles.label}>Co się stało? *</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={message}
          onChangeText={setMessage}
          placeholder="Opisz, co, gdzie i kiedy się wydarzyło"
          placeholderTextColor={c.muted}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.label}>Miejscowość</Text>
        <TextInput
          style={styles.input}
          value={place}
          onChangeText={setPlace}
          placeholder="np. Świdnica, ul. Długa"
          placeholderTextColor={c.muted}
        />

        <Text style={styles.label}>
          Zdjęcia lub filmy ({attachments.length}/{MAX_ATTACHMENTS})
        </Text>
        <View style={styles.thumbs}>
          {attachments.map((a, i) => (
            <View key={a.uri} style={styles.thumbWrap}>
              <Image source={a.uri} style={styles.thumb} contentFit="cover" />
              {a.isVideo && (
                <View style={styles.videoBadge}>
                  <Ionicons name="videocam" size={12} color="#fff" />
                </View>
              )}
              <Pressable
                style={styles.thumbRemove}
                hitSlop={6}
                onPress={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                accessibilityLabel="Usuń załącznik">
                <Ionicons name="close-circle" size={22} color="#fff" />
              </Pressable>
            </View>
          ))}
          {attachments.length < MAX_ATTACHMENTS && (
            <Pressable style={styles.addThumb} onPress={pick} accessibilityLabel="Dodaj zdjęcie lub film">
              <Ionicons name="add" size={28} color={c.primary} />
            </Pressable>
          )}
        </View>

        <Text style={styles.label}>Twoje imię (opcjonalnie)</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={c.muted} />

        <Text style={styles.label}>Telefon do kontaktu (opcjonalnie)</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={c.muted}
        />

        <Pressable style={[styles.send, sending && { opacity: 0.6 }]} onPress={send} disabled={sending}>
          <Ionicons name="send" size={18} color="#fff" />
          <Text style={styles.sendText}>Wyślij do redakcji</Text>
        </Pressable>
        <Text style={styles.note}>
          Wiadomość wyślesz ze swojej poczty na adres {NEWSROOM_EMAIL}. Wysyłając materiały, zgadzasz się na ich
          wykorzystanie przez redakcję Telewizji Sudeckiej.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    content: { padding: 16, paddingBottom: 40 },
    intro: { flexDirection: 'row', gap: 12, backgroundColor: c.tint, padding: 14, borderRadius: 12, marginBottom: 6 },
    introText: { flex: 1, fontSize: 14, lineHeight: 20, color: c.text },
    label: { fontSize: 14, fontWeight: '600', color: c.text, marginTop: 16, marginBottom: 6 },
    input: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      fontSize: 16,
      color: c.text,
    },
    textarea: { minHeight: 120 },
    thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    thumbWrap: { width: 76, height: 76 },
    thumb: { width: 76, height: 76, borderRadius: 8, backgroundColor: c.border },
    videoBadge: {
      position: 'absolute',
      left: 4,
      bottom: 4,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 4,
      padding: 3,
    },
    thumbRemove: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
    addThumb: {
      width: 76,
      height: 76,
      borderRadius: 8,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    send: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.primary,
      padding: 16,
      borderRadius: 12,
      marginTop: 24,
    },
    sendText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    note: { fontSize: 12, lineHeight: 17, color: c.muted, textAlign: 'center', marginTop: 12 },
  });
