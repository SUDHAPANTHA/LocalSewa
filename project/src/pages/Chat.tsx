import { useCallback, useEffect, useState } from "react";
import { Layout } from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { messagesApi } from "../api/messages";
import { adminApi } from "../api/admin";
import { Message, ServiceProvider } from "../types";
import { useToast } from "../components/Toast";
import { MessageCircle, Send } from "lucide-react";
import { getApiErrorMessage } from "../utils/errors";

export function Chat() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<ServiceProvider[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const fetchContacts = useCallback(async () => {
    try {
      const response = await adminApi.getAllProviders();
      setContacts(response.data.providers || []);
    } catch (error) {
      console.error("Failed to fetch contacts", error);
      showToast(
        getApiErrorMessage(error, "Failed to fetch contacts"),
        "error"
      );
    }
  }, [showToast]);

  const fetchMessages = useCallback(async () => {
    if (!user?.id || !selectedContact) return;
    try {
      const response = await messagesApi.getConversation(
        user.id,
        selectedContact
      );
      setMessages(response.data.conversation || []);
    } catch (error) {
      console.error("Failed to fetch messages", error);
    }
  }, [selectedContact, user?.id]);

  // Fetch contacts and initialize selectedContact
  useEffect(() => {
    fetchContacts();

    const queryString = window.location.hash.split("?")[1];
    if (queryString) {
      const receiverId = new URLSearchParams(queryString).get("receiver");
      if (receiverId) setSelectedContact(receiverId);
    }
  }, [fetchContacts]);

  // Fetch messages for selected contact periodically
  useEffect(() => {
    if (!selectedContact) return;

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedContact, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedContact || !newMessage.trim()) return;

    setLoading(true);
    try {
      await messagesApi.sendMessage({
        sender: user.id,
        receiver: selectedContact,
        content: newMessage,
      });
      setNewMessage("");
      fetchMessages();
    } catch (error) {
      showToast(
        getApiErrorMessage(error, "Failed to send message"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedContactData = contacts.find((c) => c._id === selectedContact);

  return (
    <Layout>
      {ToastComponent}
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Messages</h1>
          <p className="text-gray-600">Chat with service providers</p>
        </div>

        <div
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          style={{ height: "600px" }}
        >
          <div className="flex h-full">
            {/* Contacts */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-bold text-gray-800">Contacts</h3>
              </div>
              <div className="divide-y">
                {contacts.length === 0 ? (
                  <p className="p-4 text-gray-600 text-sm">
                    No contacts available
                  </p>
                ) : (
                  contacts.map((contact) => (
                    <button
                      key={contact._id}
                      onClick={() => setSelectedContact(contact._id)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        selectedContact === contact._id ? "bg-blue-50" : ""
                      }`}
                    >
                      <h4 className="font-bold text-gray-800">
                        {contact.name}
                      </h4>
                      <p className="text-sm text-gray-600">{contact.email}</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 flex flex-col">
              {selectedContact ? (
                <>
                  <div className="p-4 bg-gray-50 border-b">
                    <h3 className="font-bold text-gray-800">
                      {selectedContactData?.name || "Unknown"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedContactData?.email || ""}
                    </p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-12">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message._id}
                          className={`flex ${
                            message.sender === user?.id
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs px-4 py-3 rounded-2xl ${
                              message.sender === user?.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <p>{message.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender === user?.id
                                  ? "text-blue-200"
                                  : "text-gray-500"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendMessage} className="p-4 border-t">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Type a message..."
                        disabled={loading}
                      />
                      <button
                        type="submit"
                        disabled={loading || !newMessage.trim()}
                        className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        Send
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Select a contact to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
