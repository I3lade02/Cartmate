import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../store/authStore";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { MyListsScreen } from "../screens/lists/MyListsScreen";
import { InviteMemberScreen } from "../screens/lists/InviteMemberScreen";
import { ShoppingListDetailScreen } from "../screens/lists/ShoppingListDetailScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { useThemeStore } from "../store/themeStore";

export type RootStackParamList = {
    Login: undefined;
    Register: undefined;
    MyLists: undefined;
    ShoppingListDetail: {
        listId: string;
        listName: string;
    };
    InviteMember: {
        listId: string;
        listName: string;
        inviteCode: string;
    };
    Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
    const { user, isLoading } = useAuthStore();
    const hasHydratedTheme = useThemeStore((state) => state.hasHydrated);
    const theme = useThemeStore((state) => state.theme);
    const colors = theme.colors;

    if (isLoading || !hasHydratedTheme) {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.background,
                }}
            >
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
        <Stack.Navigator
            screenOptions={{
            headerStyle: {
                backgroundColor: colors.header,
            },
            headerTintColor: colors.text,
            contentStyle: {
                backgroundColor: colors.background,
            },
            }}
        >
            {user ? (
            <>
                <Stack.Screen
                name="MyLists"
                component={MyListsScreen}
                options={{ title: "CartMate" }}
                />
                <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{ title: "Settings" }}
                />
                <Stack.Screen
                name="ShoppingListDetail"
                component={ShoppingListDetailScreen}
                />
                <Stack.Screen
                name="InviteMember"
                component={InviteMemberScreen}
                options={{ title: "Invite member" }}
                />
            </>
            ) : (
            <>
                <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{ title: "Login" }}
                />
                <Stack.Screen
                name="Register"
                component={RegisterScreen}
                options={{ title: "Create account" }}
                />
            </>
            )}
        </Stack.Navigator>
        </NavigationContainer>
    );
}
