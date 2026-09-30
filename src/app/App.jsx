import { useAuth } from "../features/auth/useAuth.js";
import { instanceWarning } from "../features/auth/instanceMessages.js";
import LoginScreen from "../features/auth/LoginScreen.jsx";
import { useChats } from "../features/chats/useChats.js";
import Messenger from "../features/messages/Messenger.jsx";
import { useNotificationPolling } from "../features/messages/useNotificationPolling.js";

const App = () => {
  const auth = useAuth();
  const chats = useChats(auth.credentials, auth.sessionId, auth.sessionRef);
  const { pollError } = useNotificationPolling({
    credentials: auth.credentials,
    onNotification: chats.applyNotification,
    onInstanceState: auth.setInstanceState,
  });

  if (!auth.credentials) {
    return (
      <LoginScreen onSubmit={auth.login} pending={auth.loginPending} error={auth.loginError} />
    );
  }

  return (
    <Messenger
      idInstance={auth.credentials.idInstance}
      chats={chats.chats}
      activeChatId={chats.activeChatId}
      instanceState={auth.instanceState}
      warning={instanceWarning(auth.instanceState)}
      pollError={pollError}
      storageError={chats.storageError || auth.credentialStorageError}
      onSelectChat={chats.selectChat}
      onLogout={auth.logout}
      onStartChat={chats.startChat}
      onSend={chats.submitMessage}
      onRetry={chats.retryMessage}
    />
  );
};

export default App;
