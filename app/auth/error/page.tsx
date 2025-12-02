import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-[#1C3A63] via-[#2F5E9A] to-[#1C3A63]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card className="border-red-200 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-2xl text-red-600">Error de Autenticación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {params?.error ? (
                <p className="text-sm text-muted-foreground">Código de error: {params.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Ha ocurrido un error inesperado.</p>
              )}
              <Button asChild className="w-full bg-[#2F5E9A] hover:bg-[#1C3A63]">
                <Link href="/auth/login">Volver al inicio de sesión</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
