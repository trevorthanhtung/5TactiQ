package com.katfc.tactiq5;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "FileSaver")
public class FileSaverPlugin extends Plugin {

    private String pendingData = null;

    @PluginMethod
    public void saveAs(PluginCall call) {
        String data = call.getString("data");
        String filename = call.getString("filename", "5tactiq_backup.5tactiq");
        
        if (data == null) {
            call.reject("Must provide data to save");
            return;
        }
        
        pendingData = data;

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/octet-stream"); 
        intent.putExtra(Intent.EXTRA_TITLE, filename);
        
        startActivityForResult(call, intent, "saveFileResult");
    }

    @ActivityCallback
    private void saveFileResult(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_OK) {
            Intent data = result.getData();
            if (data != null) {
                Uri uri = data.getData();
                if (uri != null && pendingData != null) {
                    try {
                        ParcelFileDescriptor pfd = getContext().getContentResolver().openFileDescriptor(uri, "w");
                        if (pfd != null) {
                            FileOutputStream fos = new FileOutputStream(pfd.getFileDescriptor());
                            fos.write(pendingData.getBytes(StandardCharsets.UTF_8));
                            fos.close();
                            pfd.close();
                            
                            JSObject ret = new JSObject();
                            ret.put("success", true);
                            call.resolve(ret);
                            pendingData = null;
                            return;
                        }
                    } catch (Exception e) {
                        Log.e("FileSaver", "Failed to save file", e);
                        call.reject("Failed to save file: " + e.getMessage());
                        pendingData = null;
                        return;
                    }
                }
            }
        }
        call.reject("User cancelled file save dialog");
        pendingData = null;
    }
}
