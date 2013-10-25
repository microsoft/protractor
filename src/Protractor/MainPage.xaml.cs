using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Shapes;
using Microsoft.Phone.Controls;
using System.IO;
using System.IO.IsolatedStorage;
using System.Windows.Resources;
using System.ComponentModel;


namespace Protractor_WP
{
    public partial class MainPage : PhoneApplicationPage
    {
        protected BrowserMouseHelper m_helper;
        protected IsolatedStorageSettings m_settings = IsolatedStorageSettings.ApplicationSettings;
        
        protected const string MEASURED_LENGTH_KEY = "measuredLength";
        protected const string MEASURED_ANLGE_RADIANS_KEY = "measuredAngleRadians";
        protected const string SCREEN_WIDTH_MM = "screenWidthMM";
        protected const string USE_MM = "useMM";
        
        // Constructor
        public MainPage()
        {
            InitializeComponent();

            m_helper = new BrowserMouseHelper(ref webBrowser);
            m_helper.ScrollDisabled = true;

            SaveFilesToIsoStore();

            webBrowser.LoadCompleted += new System.Windows.Navigation.LoadCompletedEventHandler(webBrowser_LoadCompleted);
        }

        /// <summary>
        /// Loads the stored values from the isolated storage and sets them to the HTML5 UI.
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        void webBrowser_LoadCompleted(object sender, System.Windows.Navigation.NavigationEventArgs e)
        {
            string measuredLength = "-1";
            string measuredAngleRadians = "-1";
            string screenWidthMM = "81";    // Default for Lumia 800
            string useMM = "true";

            if (m_settings.Contains(MEASURED_LENGTH_KEY))
            {
                measuredLength = (string)m_settings[MEASURED_LENGTH_KEY];
            }

            if (m_settings.Contains(MEASURED_ANLGE_RADIANS_KEY))
            {
                measuredAngleRadians = (string)m_settings[MEASURED_ANLGE_RADIANS_KEY];
            }

            if (m_settings.Contains(SCREEN_WIDTH_MM))
            {
                screenWidthMM = (string)m_settings[SCREEN_WIDTH_MM];
            }

            if (m_settings.Contains(USE_MM))
            {
                useMM = (string)m_settings[USE_MM];
            }

            webBrowser.InvokeScript("eval", string.Format("measuredLength = {0};", measuredLength));
            webBrowser.InvokeScript("eval", string.Format("measuredAngleRadians = {0};", measuredAngleRadians));
            webBrowser.InvokeScript("eval", string.Format("screenWidthMM = {0};", screenWidthMM));
            webBrowser.InvokeScript("eval", string.Format("useMM = {0};", useMM));
            webBrowser.InvokeScript("eval", "init();");
        }

        /// <summary>
        /// Called when the main page is shown. Navigates the webbrowser to the local HTML page.
        /// </summary>
        /// <param name="e"></param>
        protected override void OnNavigatedTo(System.Windows.Navigation.NavigationEventArgs e)
        {
            webBrowser.Navigate(new Uri("html\\index.html", UriKind.Relative));
        }

        /// <summary>
        /// Called when the main page is navigated away, basically when the application is sent to background or the application is closed. 
        /// Gets the some variables from the JavaScript to store the state of the application into the isolated storage.
        /// </summary>
        /// <param name="e"></param>
        protected override void OnNavigatingFrom(System.Windows.Navigation.NavigatingCancelEventArgs e)
        {
            string measuredLength = webBrowser.InvokeScript("eval", "var value = measuredLength; value.toString();") as string;
            string measuredAngleRadians = webBrowser.InvokeScript("eval", "var value = measuredAngleRadians; value.toString();") as string;
            string screenWidthMM = webBrowser.InvokeScript("eval", "var value = screenWidthMM; value.toString();") as string;
            string useMM = webBrowser.InvokeScript("eval", "var value = useMM; value.toString();") as string;

            m_settings[MEASURED_LENGTH_KEY] = measuredLength;
            m_settings[MEASURED_ANLGE_RADIANS_KEY] = measuredAngleRadians;
            m_settings[SCREEN_WIDTH_MM] = screenWidthMM;
            m_settings[USE_MM] = useMM;
        }

        /// <summary>
        /// Handles back key press. If the HTML5 UI is on config screen the back key will close it.
        /// </summary>
        /// <param name="e"></param>
        protected override void OnBackKeyPress(CancelEventArgs e)
        {
            string inConfig = webBrowser.InvokeScript("eval", "var value = inConfig; value.toString();") as string;
            if (inConfig == "true")
            {
                webBrowser.InvokeScript("eval", "inConfig = false;");
                webBrowser.InvokeScript("eval", "draw();");
                e.Cancel = true;
            }
        }


        /// <summary>
        /// Saves the HTML files to isolated storage as files in order them to be viewer by the webbrowser component.
        /// </summary>
        private void SaveFilesToIsoStore()
        {
            // These files must match what is included in the application package,
            // or BinaryStream.Dispose below will throw an exception.
            string[] files = {
              "html/index.html",
              "html/script.js",
              "html/style.css",
              "html/papergrid.png",
              "html/settings.png"
            };

            IsolatedStorageFile isoStore = IsolatedStorageFile.GetUserStoreForApplication();

            foreach (string f in files)
            {
                StreamResourceInfo sr = Application.GetResourceStream(new Uri(f, UriKind.Relative));
                using (BinaryReader br = new BinaryReader(sr.Stream))
                {
                    byte[] data = br.ReadBytes((int)sr.Stream.Length);
                    SaveToIsoStore(f, data);
                }
            }
        }

        /// <summary>
        /// Saves a single file to the isolated storage.
        /// </summary>
        /// <param name="fileName"></param>
        /// <param name="data"></param>
        private void SaveToIsoStore(string fileName, byte[] data)
        {
            string strBaseDir = string.Empty;
            string delimStr = "/";
            char[] delimiter = delimStr.ToCharArray();
            string[] dirsPath = fileName.Split(delimiter);

            // Get the IsoStore.
            IsolatedStorageFile isoStore = IsolatedStorageFile.GetUserStoreForApplication();

            // Re-create the directory structure.
            for (int i = 0; i < dirsPath.Length - 1; i++)
            {
                strBaseDir = System.IO.Path.Combine(strBaseDir, dirsPath[i]);
                isoStore.CreateDirectory(strBaseDir);
            }

            // Remove the existing file.
            if (isoStore.FileExists(fileName))
            {
                isoStore.DeleteFile(fileName);
            }

            // Write the file.
            using (BinaryWriter bw = new BinaryWriter(isoStore.CreateFile(fileName)))
            {
                bw.Write(data);
                bw.Close();
            }
        }
    }
}