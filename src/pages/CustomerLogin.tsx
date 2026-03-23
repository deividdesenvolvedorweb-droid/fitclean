import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { validateCPF } from "@/lib/cpf";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

const registerSchema = z.object({
  fullName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  phone: z.string().min(10, "Telefone inválido").max(15),
  cpf: z.string().min(11, "CPF inválido").max(14).refine((val) => validateCPF(val), "CPF inválido"),
  zipCode: z.string().min(8, "CEP inválido").max(9),
  street: z.string().min(3, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 letras"),
});

type LoginData = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;

export default function CustomerLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/conta";
  const { user, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(redirect, { replace: true });
    }
  }, [user, loading, navigate, redirect]);

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "", email: "", password: "", phone: "", cpf: "",
      zipCode: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "",
    },
  });

  const fetchCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setIsFetchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        registerForm.setValue("street", data.logradouro || "");
        registerForm.setValue("neighborhood", data.bairro || "");
        registerForm.setValue("city", data.localidade || "");
        registerForm.setValue("state", data.uf || "");
      }
    } catch {} finally { setIsFetchingCep(false); }
  };

  const onLogin = async (data: LoginData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email, password: data.password,
      });
      if (error) throw error;
      toast.success("Login realizado!");
      navigate(redirect, { replace: true });
    } catch (e: any) {
      toast.error(e.message === "Invalid login credentials" ? "Email ou senha incorretos" : e.message);
    } finally { setIsSubmitting(false); }
  };

  const onRegister = async (data: RegisterData) => {
    setIsSubmitting(true);
    try {
      const cleanCpf = data.cpf.replace(/\D/g, "");
      const { data: cpfCheck } = await supabase
        .from("customers").select("id").eq("cpf", cleanCpf).limit(1);
      if (cpfCheck && cpfCheck.length > 0) {
        toast.error("Este CPF já está cadastrado. Faça login com sua conta existente.");
        setIsSubmitting(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirect}`,
          data: { full_name: data.fullName },
        },
      });
      if (authError) throw authError;

      if (authData.user) {
        await supabase.from("profiles").insert({
          user_id: authData.user.id,
          email: data.email,
          full_name: data.fullName,
          phone: data.phone,
        });

        const { data: customer } = await supabase.from("customers").insert({
          email: data.email,
          full_name: data.fullName,
          phone: data.phone,
          cpf: data.cpf,
          user_id: authData.user.id,
        }).select("id").single();

        if (customer) {
          await supabase.from("customer_addresses").insert({
            customer_id: customer.id,
            recipient_name: data.fullName,
            zip_code: data.zipCode,
            street: data.street,
            number: data.number,
            complement: data.complement || null,
            neighborhood: data.neighborhood,
            city: data.city,
            state: data.state,
            is_default: true,
          });
        }
      }

      toast.success("Conta criada! Verifique seu email para confirmar o cadastro.");
    } catch (e: any) {
      toast.error(e.message);
    } finally { setIsSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-grow flex items-center justify-center py-8 sm:py-12 px-4">
        <Card className="w-full max-w-lg border-border/50 shadow-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl sm:text-2xl">Minha Conta</CardTitle>
            <CardDescription className="text-sm">Faça login ou crie sua conta para comprar</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 rounded-xl">
                <TabsTrigger value="login" className="rounded-lg text-sm">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg text-sm">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-5 sm:mt-6">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField control={loginForm.control} name="email" render={({ field }) => (
                      <FormItem><FormLabel className="text-sm">Email</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={loginForm.control} name="password" render={({ field }) => (
                      <FormItem><FormLabel className="text-sm">Senha</FormLabel><FormControl>
                        <div className="relative">
                          <Input type={showPassword ? "text" : "password"} placeholder="••••••" className="rounded-xl pr-10" {...field} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full rounded-xl" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Entrando...</> : "Entrar"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register" className="mt-5 sm:mt-6">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField control={registerForm.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel className="text-sm">Nome Completo</FormLabel><FormControl><Input placeholder="Seu nome" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={registerForm.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Email</FormLabel><FormControl><Input type="email" placeholder="seu@email.com" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={registerForm.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Senha</FormLabel><FormControl><Input type="password" placeholder="••••••" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField control={registerForm.control} name="phone" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">Telefone</FormLabel><FormControl><Input placeholder="(11) 99999-9999" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={registerForm.control} name="cpf" render={({ field }) => (
                        <FormItem><FormLabel className="text-sm">CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>

                    <div className="border-t border-border pt-4 mt-4">
                      <p className="text-sm font-medium mb-3">Endereço</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField control={registerForm.control} name="zipCode" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm">CEP</FormLabel><FormControl>
                            <div className="relative">
                              <Input placeholder="00000-000" className="rounded-xl" {...field} onBlur={(e) => { field.onBlur(); fetchCep(e.target.value); }} />
                              {isFetchingCep && <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                            </div>
                          </FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={registerForm.control} name="street" render={({ field }) => (
                          <FormItem className="sm:col-span-2"><FormLabel className="text-sm">Rua</FormLabel><FormControl><Input placeholder="Rua..." className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <FormField control={registerForm.control} name="number" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm">Número</FormLabel><FormControl><Input placeholder="123" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={registerForm.control} name="complement" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm">Complemento</FormLabel><FormControl><Input placeholder="Apto..." className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={registerForm.control} name="neighborhood" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm">Bairro</FormLabel><FormControl><Input placeholder="Bairro" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <FormField control={registerForm.control} name="city" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm">Cidade</FormLabel><FormControl><Input placeholder="Cidade" className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={registerForm.control} name="state" render={({ field }) => (
                          <FormItem><FormLabel className="text-sm">Estado</FormLabel><FormControl><Input placeholder="SP" maxLength={2} className="rounded-xl" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                    </div>

                    <Button type="submit" className="w-full rounded-xl" disabled={isSubmitting}>
                      {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando conta...</> : "Criar Conta"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
