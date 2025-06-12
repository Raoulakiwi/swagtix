import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Card, Button, List, Avatar, Switch, Modal, message, Tooltip, Divider } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SettingOutlined, 
  QuestionCircleOutlined, 
  LogoutOutlined,
  CopyOutlined,
  QrcodeOutlined,
  BellOutlined,
  CheckCircleFilled,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@/ui/utils';
import { SWAGTIX_COLORS, useTheme, getGradientTextStyle } from '@/ui/utils/theme';
import web3authService from '@/background/service/web3auth';
import LogoSVG from '@/ui/assets/logo.svg';

const Container = styled.div`
  padding: 24px;
  max-width: 600px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin: 0;
`;

const AccountCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  
  .ant-card-body {
    padding: 24px;
  }
`;

const UserInfoContainer = styled.div`
  display: flex;
  align-items: center;
`;

const UserAvatar = styled(Avatar)`
  width: 64px;
  height: 64px;
  margin-right: 16px;
  background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE});
  display: flex;
  align-items: center;
  justify-content: center;
  
  .anticon {
    font-size: 32px;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const UserEmail = styled.p`
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 8px;
`;

const AccountIdContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.04);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 16px;
`;

const AccountIdLabel = styled.span`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  margin-right: 8px;
`;

const AccountId = styled.span`
  font-family: monospace;
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const ListItemMeta = styled(List.Item.Meta)`
  .ant-list-item-meta-title {
    margin-bottom: 0;
  }
`;

const LogoutButton = styled(Button)`
  background: linear-gradient(to right, ${SWAGTIX_COLORS.PURPLE}, ${SWAGTIX_COLORS.PINK});
  border: none;
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  
  &:hover, &:focus {
    background: linear-gradient(to right, ${SWAGTIX_COLORS.BLUE}, ${SWAGTIX_COLORS.PURPLE});
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const GradientText = styled.span`
  ${getGradientTextStyle()}
`;

const VersionText = styled.div`
  text-align: center;
  margin-top: 24px;
  color: rgba(0, 0, 0, 0.45);
  font-size: 12px;
`;

const Account: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const wallet = useWallet();
  const { isDark, themeMode, setTheme } = useTheme();
  
  const [userInfo, setUserInfo] = useState<any>(null);
  const [accountAddress, setAccountAddress] = useState<string>('');
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  
  // Fetch user info and account address
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get Web3Auth user info
        const info = await web3authService.getWeb3AuthUserInfo();
        setUserInfo(info);
        
        // Get current account address
        const account = await wallet.getCurrentAccount();
        if (account?.address) {
          setAccountAddress(account.address);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, [wallet]);
  
  // Handle copy account ID
  const handleCopyAccountId = () => {
    if (accountAddress) {
      navigator.clipboard.writeText(accountAddress);
      message.success(t('Account ID copied to clipboard'));
    }
  };
  
  // Handle show QR code
  const handleShowQR = () => {
    setQrModalVisible(true);
  };
  
  // Handle change PIN
  const handleChangePin = () => {
    history.push('/settings/security');
  };
  
  // Handle toggle notifications
  const handleToggleNotifications = (checked: boolean) => {
    setNotificationsEnabled(checked);
    message.success(t(checked ? 'Notifications enabled' : 'Notifications disabled'));
  };
  
  // Handle theme change
  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };
  
  // Handle logout
  const handleLogout = async () => {
    setLogoutModalVisible(false);
    
    try {
      await web3authService.logout();
      await wallet.lock();
      history.push('/unlock');
    } catch (error) {
      console.error('Error logging out:', error);
      message.error(t('Failed to log out'));
    }
  };
  
  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Container>
      <Header>
        <Title>{t('My Account')}</Title>
      </Header>
      
      {/* User Profile Card */}
      <AccountCard>
        <UserInfoContainer>
          <UserAvatar icon={<UserOutlined />} src={userInfo?.profileImage} />
          <UserInfo>
            <UserName>
              {userInfo?.name || t('Ticket Holder')}
            </UserName>
            <UserEmail>{userInfo?.email || t('No email provided')}</UserEmail>
          </UserInfo>
        </UserInfoContainer>
        
        <AccountIdContainer>
          <AccountIdLabel>{t('Account ID')}:</AccountIdLabel>
          <AccountId>{formatAddress(accountAddress)}</AccountId>
          <ActionButtons>
            <Tooltip title={t('Copy Account ID')}>
              <Button 
                icon={<CopyOutlined />} 
                size="small" 
                onClick={handleCopyAccountId}
              />
            </Tooltip>
            <Tooltip title={t('Show QR Code')}>
              <Button 
                icon={<QrcodeOutlined />} 
                size="small" 
                onClick={handleShowQR}
              />
            </Tooltip>
          </ActionButtons>
        </AccountIdContainer>
      </AccountCard>
      
      {/* Security Settings */}
      <AccountCard>
        <SectionTitle>{t('Security')}</SectionTitle>
        <List itemLayout="horizontal">
          <List.Item 
            actions={[<Button key="change" onClick={handleChangePin}>{t('Change')}</Button>]}
          >
            <ListItemMeta
              avatar={<Avatar icon={<LockOutlined />} style={{ backgroundColor: SWAGTIX_COLORS.PURPLE }} />}
              title={t('PIN Code')}
              description={t('Change your login PIN')}
            />
          </List.Item>
        </List>
      </AccountCard>
      
      {/* App Settings */}
      <AccountCard>
        <SectionTitle>{t('App Settings')}</SectionTitle>
        <List itemLayout="horizontal">
          <List.Item
            actions={[
              <Switch 
                key="notifications" 
                checked={notificationsEnabled} 
                onChange={handleToggleNotifications} 
              />
            ]}
          >
            <ListItemMeta
              avatar={<Avatar icon={<BellOutlined />} style={{ backgroundColor: SWAGTIX_COLORS.BLUE }} />}
              title={t('Notifications')}
              description={t('Get alerts about your tickets')}
            />
          </List.Item>
          <List.Item
            actions={[
              <Switch 
                key="darkMode" 
                checked={isDark} 
                onChange={handleThemeChange} 
              />
            ]}
          >
            <ListItemMeta
              avatar={<Avatar icon={<SettingOutlined />} style={{ backgroundColor: SWAGTIX_COLORS.PINK }} />}
              title={t('Dark Mode')}
              description={t('Switch between light and dark theme')}
            />
          </List.Item>
        </List>
      </AccountCard>
      
      {/* Help & Support */}
      <AccountCard>
        <SectionTitle>{t('Help & Support')}</SectionTitle>
        <List itemLayout="horizontal">
          <List.Item
            actions={[<Button key="view">{t('View')}</Button>]}
          >
            <ListItemMeta
              avatar={<Avatar icon={<QuestionCircleOutlined />} style={{ backgroundColor: SWAGTIX_COLORS.PURPLE }} />}
              title={t('FAQ')}
              description={t('Frequently asked questions')}
            />
          </List.Item>
          <List.Item
            actions={[<Button key="contact">{t('Contact')}</Button>]}
          >
            <ListItemMeta
              avatar={<Avatar icon={<QuestionCircleOutlined />} style={{ backgroundColor: SWAGTIX_COLORS.BLUE }} />}
              title={t('Support')}
              description={t('Get help with your tickets')}
            />
          </List.Item>
        </List>
      </AccountCard>
      
      {/* Logout Button */}
      <LogoutButton 
        type="primary" 
        icon={<LogoutOutlined />}
        onClick={() => setLogoutModalVisible(true)}
      >
        {t('Log Out')}
      </LogoutButton>
      
      <VersionText>
        <GradientText>SwagTix</GradientText> v1.0.0
      </VersionText>
      
      {/* Logout Confirmation Modal */}
      <Modal
        title={t('Log Out')}
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setLogoutModalVisible(false)}>
            {t('Cancel')}
          </Button>,
          <Button 
            key="logout" 
            type="primary" 
            danger
            onClick={handleLogout}
          >
            {t('Log Out')}
          </Button>,
        ]}
        centered
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <ExclamationCircleOutlined style={{ fontSize: 22, color: '#faad14', marginRight: 16 }} />
          <p>{t('Are you sure you want to log out? You\'ll need your PIN or email to log back in.')}</p>
        </div>
      </Modal>
      
      {/* QR Code Modal */}
      <Modal
        title={t('Your Account QR Code')}
        visible={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setQrModalVisible(false)}>
            {t('Close')}
          </Button>,
        ]}
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
          {accountAddress && (
            <div style={{ 
              padding: 16, 
              background: 'white', 
              borderRadius: 8,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              marginBottom: 16
            }}>
              {/* This would be a QR code component in the real implementation */}
              <div style={{ 
                width: 200, 
                height: 200, 
                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath d='M40,40 L40,80 L80,80 L80,40 Z M50,50 L70,50 L70,70 L50,70 Z' fill='black'%3E%3C/path%3E%3Cpath d='M100,40 L100,80 L140,80 L140,40 Z M110,50 L130,50 L130,70 L110,70 Z' fill='black'%3E%3C/path%3E%3Cpath d='M40,100 L40,140 L80,140 L80,100 Z M50,110 L70,110 L70,130 L50,130 Z' fill='black'%3E%3C/path%3E%3Cpath d='M100,100 L100,140 L140,140 L140,100 Z M110,110 L130,110 L130,130 L110,130 Z' fill='black'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundSize: 'contain'
              }} />
            </div>
          )}
          <p style={{ fontWeight: 'bold' }}>{t('Account ID')}</p>
          <p style={{ fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'center' }}>
            {accountAddress}
          </p>
          <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, textAlign: 'center' }}>
            {t('Scan this code to send tickets to this account')}
          </p>
        </div>
      </Modal>
    </Container>
  );
};

export default Account;
