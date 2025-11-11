# Script PowerShell pour configurer le pare-feu Windows pour Next.js

Write-Host "Configuration du pare-feu Windows pour Next.js..." -ForegroundColor Cyan

# Verifier si la regle existe deja
$existingRule = Get-NetFirewallRule -Name "Next.js Dev Server" -ErrorAction SilentlyContinue

if ($existingRule) {
    Write-Host "La regle existe deja. Suppression de l'ancienne regle..." -ForegroundColor Yellow
    Remove-NetFirewallRule -Name "Next.js Dev Server" -ErrorAction SilentlyContinue
}

# Creer la nouvelle regle
Write-Host "Creation de la regle de pare-feu..." -ForegroundColor Cyan

try {
    New-NetFirewallRule -Name "Next.js Dev Server" `
        -DisplayName "Next.js Dev Server (Port 3000)" `
        -Description "Autorise les connexions entrantes sur le port 3000 pour le serveur de developpement Next.js" `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort 3000 `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Enabled True

    Write-Host "Regle de pare-feu creee avec succes !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant acceder a l'application depuis votre iPhone :" -ForegroundColor Cyan
    Write-Host "   http://192.168.1.200:3000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Assurez-vous que :" -ForegroundColor Yellow
    Write-Host "   - Votre iPhone est sur le meme WiFi que votre ordinateur" -ForegroundColor White
    Write-Host "   - Le serveur Next.js est demarre (npm run dev)" -ForegroundColor White
} catch {
    Write-Host "Erreur lors de la creation de la regle." -ForegroundColor Red
    Write-Host "Essayez de l'executer en tant qu'administrateur." -ForegroundColor Red
    Write-Host ""
    Write-Host "Pour executer en tant qu'administrateur :" -ForegroundColor Yellow
    Write-Host "   1. Clic droit sur PowerShell" -ForegroundColor White
    Write-Host "   2. Selectionnez Executer en tant qu'administrateur" -ForegroundColor White
    Write-Host "   3. Naviguez vers D:\App\Missions" -ForegroundColor White
    Write-Host "   4. Executez : .\setup-firewall.ps1" -ForegroundColor White
}
