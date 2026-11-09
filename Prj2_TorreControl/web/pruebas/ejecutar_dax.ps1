param([string]$Ventana = "Prj2_TorreControl", [string]$Entrada, [string]$Salida)
# Ejecuta en el modelo abierto en Power BI Desktop las consultas DAX de un JSON [{id, dax}] y guarda los resultados
# (una fila por consulta) en otro JSON {id: {ok, valores | error}}. Las fechas salen como numero de serie de DAX.
# Lo lanza sacar_esperado.py; el texto de las consultas va en el JSON para no depender de la codificacion del script.
$ErrorActionPreference = "Stop"
$pbi = Get-Process PBIDesktop -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -like "*$Ventana*" } | Select-Object -First 1
if (-not $pbi) { throw "No encuentro Power BI Desktop con la ventana '$Ventana'." }
$ms = Get-CimInstance Win32_Process -Filter "Name='msmdsrv.exe'" | Where-Object { $_.ParentProcessId -eq $pbi.Id } | Select-Object -First 1
if (-not $ms) { throw "Power BI Desktop todavia no ha arrancado su motor." }
$carpeta = [regex]::Match($ms.CommandLine, '-s\s+"([^"]+)"').Groups[1].Value
$puerto = ([IO.File]::ReadAllText((Join-Path $carpeta "msmdsrv.port.txt")) -replace "`0", "").Trim()
Add-Type -Path "C:/Program Files/Microsoft Power BI Desktop/bin/Microsoft.PowerBI.AdomdClient.dll"
$con = New-Object Microsoft.AnalysisServices.AdomdClient.AdomdConnection("Data Source=localhost:$puerto")
$con.Open()
$consultas = [IO.File]::ReadAllText($Entrada, [Text.Encoding]::UTF8) | ConvertFrom-Json
$epoca = [datetime]'1899-12-30'
$res = [ordered]@{}
foreach ($c in $consultas) {
    $cmd = $con.CreateCommand()
    $cmd.CommandText = $c.dax
    $cmd.CommandTimeout = 300
    try {
        $r = $cmd.ExecuteReader()
        $filas = @()
        while ($r.Read()) {
            $vals = @()
            for ($i = 0; $i -lt $r.FieldCount; $i++) {
                $v = $r.GetValue($i)
                if ($v -is [datetime]) { $v = ($v - $epoca).TotalDays }
                elseif ($v -is [DBNull]) { $v = $null }
                elseif ($v -is [decimal]) { $v = [double]$v }
                $vals += , $v
            }
            $filas += , $vals
        }
        $r.Close()
        $res[$c.id] = [ordered]@{ ok = $true; filas = $filas }
    }
    catch { $res[$c.id] = [ordered]@{ ok = $false; error = $_.Exception.Message } }
}
$con.Close()
[IO.File]::WriteAllText($Salida, ($res | ConvertTo-Json -Depth 6 -Compress), (New-Object Text.UTF8Encoding($false)))
"puerto $puerto - consultas: $($consultas.Count)"
