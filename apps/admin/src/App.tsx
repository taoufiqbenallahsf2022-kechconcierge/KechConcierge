import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { useAuth } from "./auth/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { DataHub } from "./pages/DataHub";
import {
  SenderEmailsPage,
} from "./pages/StudioPages";
import { EmailStudioPage } from "./pages/EnhancedStudioPages";
import { AutomationEditorPage, AutomationsListPage, FlowsListPage } from "./pages/AutomationManagementPages";
import { VisualFlowEditorPage } from "./pages/VisualFlowBuilderPage";
import { IndividualList, IndividualCreate, IndividualDetail } from "./features/individuals/IndividualPages";
import { ProductsList, ProductsCreate, ProductsDetail } from "./features/products/ProductsPages";
import { LeadsList, LeadsCreate, LeadsDetail } from "./features/leads/LeadsPages";
import { ProspectsList, ProspectsCreate, ProspectsDetail } from "./features/prospects/ProspectsPages";
import { AccountsList, AccountsCreate, AccountsDetail } from "./features/accounts/AccountsPages";
import { ConsentsList, ConsentsCreate, ConsentsDetail } from "./features/consents/ConsentsPages";
import { UsersList, UsersCreate, UsersDetail } from "./features/users/UsersPages";
import { PageVisitsList, PageVisitsDetail } from "./features/page-visits/PageVisitsPages";
import { ContactRequestsList, ContactRequestsDetail } from "./features/contact-requests/ContactRequestsPages";
import { ChatList, ChatDetail } from "./features/chats/ChatPages";
import { WhatsappConversationsList, WhatsappConversationsDetail } from "./features/whatsapp-conversations/WhatsappConversationsPages";
import { WhatsappMessagesList, WhatsappMessagesDetail } from "./features/whatsapp-messages/WhatsappMessagesPages";
import { ChatMessagesList, ChatMessagesDetail } from "./features/chat-messages/ChatMessagesPages";

function entityRoutes({
  list: List,
  create: Create,
  detail: Detail,
  path,
}: {
  list: any;
  create?: any;
  detail: any;
  path: string;
}) {
  return (
    <>
      <Route path={`entities/${path}`} element={<List />} />
      {Create && <Route path={`entities/${path}/new`} element={<Create />} />}
      <Route path={`entities/${path}/:id`} element={<Detail />} />
    </>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="auth-loading">
        <div className="brand-mark">M</div>
        <span>Opening your workspace…</span>
      </div>
    );
  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/data-hub" replace />} />
        <Route path="data-hub" element={<DataHub />} />
        <Route path="email-studio" element={<EmailStudioPage />} />
        <Route path="automation-studio/automations" element={<AutomationsListPage />} />
        <Route path="automation-studio/automations/new" element={<AutomationEditorPage />} />
        <Route path="automation-studio/automations/:id" element={<AutomationEditorPage />} />
        <Route path="automation-studio/flows" element={<FlowsListPage />} />
        <Route path="automation-studio/flows/new" element={<VisualFlowEditorPage />} />
        <Route path="automation-studio/flows/:id" element={<VisualFlowEditorPage />} />
        <Route path="setup/sender-emails" element={<SenderEmailsPage />} />
        {entityRoutes({ list: IndividualList, create: IndividualCreate, detail: IndividualDetail, path: "individuals" })}
        {entityRoutes({ list: ProductsList, create: ProductsCreate, detail: ProductsDetail, path: "products" })}
        {entityRoutes({ list: LeadsList, create: LeadsCreate, detail: LeadsDetail, path: "leads" })}
        {entityRoutes({ list: ProspectsList, create: ProspectsCreate, detail: ProspectsDetail, path: "prospects" })}
        {entityRoutes({ list: AccountsList, create: AccountsCreate, detail: AccountsDetail, path: "accounts" })}
        {entityRoutes({ list: ConsentsList, create: ConsentsCreate, detail: ConsentsDetail, path: "consents" })}
        {entityRoutes({ list: UsersList, create: UsersCreate, detail: UsersDetail, path: "users" })}
        {entityRoutes({ list: PageVisitsList, detail: PageVisitsDetail, path: "page-visits" })}
        {entityRoutes({ list: ContactRequestsList, detail: ContactRequestsDetail, path: "contact-requests" })}
        <Route path="entities/chats" element={<ChatList />} />
        <Route path="chats/:id" element={<ChatDetail />} />
        {entityRoutes({ list: WhatsappConversationsList, detail: WhatsappConversationsDetail, path: "whatsapp-conversations" })}
        {entityRoutes({ list: WhatsappMessagesList, detail: WhatsappMessagesDetail, path: "whatsapp-messages" })}
        {entityRoutes({ list: ChatMessagesList, detail: ChatMessagesDetail, path: "chat-messages" })}
      </Route>
    </Routes>
  );
}
