import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { toast } from "sonner";
import { PromoCode } from '@/api/entities';
import { format } from 'date-fns';

export default function PromoCodeManager({ promoCodes, setPromoCodes, permissions }) {
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentPromo, setCurrentPromo] = useState(null);

    const openCreateModal = () => {
        setIsEditing(false);
        setCurrentPromo({
            code: '',
            discount_type: 'percentage',
            discount_value: 10,
            expiry_date: '',
            usage_limit: 100,
            is_active: true,
        });
        setShowModal(true);
    };

    const openEditModal = (promo) => {
        setIsEditing(true);
        setCurrentPromo({ 
            ...promo,
            expiry_date: promo.expiry_date ? format(new Date(promo.expiry_date), "yyyy-MM-dd'T'HH:mm") : ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!permissions.isSuperAdmin) {
            toast.error("Only Super Admins can save promo codes.");
            return;
        }

        if (!currentPromo.code || !currentPromo.discount_value) {
            toast.error("Code and Discount Value are required.");
            return;
        }

        try {
            const payload = {
                ...currentPromo,
                discount_value: Number(currentPromo.discount_value),
                usage_limit: Number(currentPromo.usage_limit),
                expiry_date: currentPromo.expiry_date ? new Date(currentPromo.expiry_date).toISOString() : null
            };
            
            if (isEditing) {
                await PromoCode.update(currentPromo.id, payload);
                setPromoCodes(promoCodes.map(p => p.id === currentPromo.id ? { ...p, ...payload } : p));
                toast.success(`Promo code "${payload.code}" updated.`);
            } else {
                const newPromo = await PromoCode.create(payload);
                setPromoCodes([newPromo, ...promoCodes]);
                toast.success(`Promo code "${payload.code}" created.`);
            }
            setShowModal(false);
        } catch (error) {
            console.error("Error saving promo code:", error);
            toast.error("Failed to save promo code. It might already exist.");
        }
    };

    const handleDelete = async (promoId) => {
        if (!permissions.isSuperAdmin) {
            toast.error("Only Super Admins can delete promo codes.");
            return;
        }
        
        try {
            await PromoCode.delete(promoId);
            setPromoCodes(promoCodes.filter(p => p.id !== promoId));
            toast.success("Promo code deleted.");
        } catch (error) {
            console.error("Error deleting promo code:", error);
            toast.error("Failed to delete promo code.");
        }
    };

    return (
        <Card className="shadow-md border-0 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Promo Code Management</CardTitle>
                <Button onClick={openCreateModal} disabled={!permissions.isSuperAdmin}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Promo Code
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Usage</TableHead>
                            <TableHead>Expires On</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {promoCodes.map(promo => (
                            <TableRow key={promo.id}>
                                <TableCell className="font-medium">{promo.code}</TableCell>
                                <TableCell>
                                    {promo.discount_type === 'flat' ? `₹${promo.discount_value}` : `${promo.discount_value}%`}
                                </TableCell>
                                <TableCell>{promo.current_usage} / {promo.usage_limit}</TableCell>
                                <TableCell>
                                    {promo.expiry_date ? new Date(promo.expiry_date).toLocaleDateString() : 'No Expiry'}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={promo.is_active ? 'default' : 'destructive'} className={promo.is_active ? 'bg-green-100 text-green-800' : ''}>
                                        {promo.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => openEditModal(promo)} disabled={!permissions.isSuperAdmin}>
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)} disabled={!permissions.isSuperAdmin}>
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{isEditing ? 'Edit' : 'Create'} Promo Code</DialogTitle>
                            <DialogDescription>
                                {isEditing ? 'Update the details for this promo code.' : 'Create a new promo code for users.'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="code" className="text-right">Code</Label>
                                <Input id="code" value={currentPromo?.code} onChange={(e) => setCurrentPromo({...currentPromo, code: e.target.value})} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="discount_type" className="text-right">Type</Label>
                                <Select value={currentPromo?.discount_type} onValueChange={(val) => setCurrentPromo({...currentPromo, discount_type: val})}>
                                    <SelectTrigger className="col-span-3">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="discount_value" className="text-right">Value</Label>
                                <Input id="discount_value" type="number" value={currentPromo?.discount_value} onChange={(e) => setCurrentPromo({...currentPromo, discount_value: e.target.value})} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="expiry_date" className="text-right">Expiry Date</Label>
                                <Input id="expiry_date" type="datetime-local" value={currentPromo?.expiry_date} onChange={(e) => setCurrentPromo({...currentPromo, expiry_date: e.target.value})} className="col-span-3" />
                            </div>
                             <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="usage_limit" className="text-right">Usage Limit</Label>
                                <Input id="usage_limit" type="number" value={currentPromo?.usage_limit} onChange={(e) => setCurrentPromo({...currentPromo, usage_limit: e.target.value})} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="is_active" className="text-right">Active</Label>
                                <Switch id="is_active" checked={currentPromo?.is_active} onCheckedChange={(checked) => setCurrentPromo({...currentPromo, is_active: checked})} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button onClick={handleSave}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}