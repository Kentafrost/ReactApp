Set WshShell = CreateObject("WScript.Shell")

' PowerShell を使ってファイル選択ダイアログを開く
psCommand = "Add-Type -AssemblyName System.Windows.Forms;" & _
            "$f = New-Object System.Windows.Forms.OpenFileDialog;" & _
            "$f.Filter = 'Batch Files (*.bat)|*.bat';" & _
            "if($f.ShowDialog() -eq 'OK'){Write-Output $f.FileName}"

Set exec = WshShell.Exec("powershell -NoProfile -Command " & Chr(34) & psCommand & Chr(34)) 
SelectedFile = exec.StdOut.ReadAll 
SelectedFile = Trim(Replace(Replace(SelectedFile, vbCr, ""), vbLf, ""))

' PowerShell の出力（選択されたファイルのフルパス）を取得
SelectedFile = Trim(exec.StdOut.ReadAll)

If SelectedFile <> "" Then
    ' 非表示で実行
    WshShell.Run Chr(34) & SelectedFile & Chr(34), 0, False
End If

WScript.Quit