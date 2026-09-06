import {api, Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, graphql} from '@vendure/dashboard';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {Bell, CheckCircle2, Loader2} from 'lucide-react';
import {useEffect, useState} from 'react';
import {toast} from 'sonner';

const settingsQuery = graphql(`
    query EmgOrderNotifySettings {
        emgOrderNotifySettings {
            orderNotifyMode
            orderNotifyAdministratorIds
            administrators {
                id
                firstName
                lastName
                emailAddress
            }
        }
    }
`);

const updateSettingsMutation = graphql(`
    mutation EmgUpdateOrderNotifySettings($orderNotifyMode: String!, $orderNotifyAdministratorIds: String) {
        emgUpdateOrderNotifySettings(
            orderNotifyMode: $orderNotifyMode
            orderNotifyAdministratorIds: $orderNotifyAdministratorIds
        ) {
            orderNotifyMode
            orderNotifyAdministratorIds
        }
    }
`);

export function OrderNotifySettingsPage() {
    const queryClient = useQueryClient();
    const [mode, setMode] = useState('default');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const query = useQuery({
        queryKey: ['emg-order-notify-settings'],
        queryFn: () => api.query(settingsQuery, {}),
    });

    useEffect(() => {
        const data = query.data?.emgOrderNotifySettings;
        if (!data) return;
        setMode(data.orderNotifyMode || 'default');
        setSelectedIds(
            String(data.orderNotifyAdministratorIds || '')
                .split(',')
                .map((s: string) => s.trim())
                .filter(Boolean),
        );
    }, [query.data]);

    const saveMutation = useMutation({
        mutationFn: async () =>
            api.mutate(updateSettingsMutation, {
                orderNotifyMode: mode,
                orderNotifyAdministratorIds: selectedIds.join(','),
            }),
        onSuccess: async () => {
            toast.success('Order notification settings saved');
            await queryClient.invalidateQueries({queryKey: ['emg-order-notify-settings']});
        },
        onError: (error: Error) => {
            toast.error('Failed to save settings', {description: error.message});
        },
    });

    const admins = query.data?.emgOrderNotifySettings?.administrators ?? [];

    const toggleAdmin = (id: string) => {
        setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    return (
        <div className="mx-auto max-w-2xl space-y-6 p-4 md:p-6">
            <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                    <Bell className="size-6" />
                    Order email notifications
                </h1>
                <p className="text-sm text-muted-foreground">
                    Choose who receives an email when a customer places an order with payment proof.
                    After a staff member confirms payment, the customer receives the paid-order email
                    with invoice.
                </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 space-y-5">
                <div className="grid gap-2">
                    <Label>Recipients</Label>
                    <Select value={mode} onValueChange={setMode}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Default admin email (env)</SelectItem>
                            <SelectItem value="all">All administrators</SelectItem>
                            <SelectItem value="specific">Specific staff only</SelectItem>
                            <SelectItem value="none">None (no staff emails)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {mode === 'specific' && (
                    <div className="grid gap-2">
                        <Label>Select staff</Label>
                        <div className="rounded-lg border border-border divide-y max-h-64 overflow-y-auto">
                            {admins.map((admin: {id: string; firstName: string; lastName: string; emailAddress: string}) => {
                                const checked = selectedIds.includes(admin.id);
                                return (
                                    <label
                                        key={admin.id}
                                        className="flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer hover:bg-muted/40"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleAdmin(admin.id)}
                                        />
                                        <span className="min-w-0">
                                            <span className="font-medium block">
                                                {admin.firstName} {admin.lastName}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {admin.emailAddress || `ID ${admin.id}`}
                                            </span>
                                        </span>
                                    </label>
                                );
                            })}
                            {!admins.length && (
                                <p className="px-3 py-4 text-sm text-muted-foreground">
                                    No administrators found.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <Button
                    type="button"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                >
                    {saveMutation.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                        <CheckCircle2 className="mr-2 size-4" />
                    )}
                    Save notification settings
                </Button>
            </div>
        </div>
    );
}
